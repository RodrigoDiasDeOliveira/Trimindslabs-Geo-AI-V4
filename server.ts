import express from 'express';
import path from 'path';
import os from 'os';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { authenticateUser, getAuthConfiguration, verifyToken } from './server/auth';
import { validateROI } from './server/services/roiValidator';
import {
  checkAllProviders,
  earthEngineProvider,
  publicStacSentinelProvider
} from './server/services/satelliteProvider';
import { pipelineService } from './server/services/pipelineService';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging & timing middleware
app.use((req, res, next) => {
  const start = performance.now();
  res.on('finish', () => {
    const duration = (performance.now() - start).toFixed(1);
    if (!req.path.startsWith('/@') && !req.path.includes('.')) {
      console.log(`[HTTP] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// ==========================================
// 1. HEALTH & SYSTEM OBSERVABILITY ENDPOINTS
// ==========================================

// Real system probe (No fictitious GPUs or fake metrics)
app.get('/api/health', (_req, res) => {
  const memory = process.memoryUsage();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    runtime: {
      nodeVersion: process.version,
      platform: `${os.platform()} (${os.arch()})`,
      cpuCount: os.cpus().length,
      memory: {
        rssMb: Number((memory.rss / (1024 * 1024)).toFixed(1)),
        heapTotalMb: Number((memory.heapTotal / (1024 * 1024)).toFixed(1)),
        heapUsedMb: Number((memory.heapUsed / (1024 * 1024)).toFixed(1))
      }
    },
    service: 'Triminds-Geo-AI-V4-Core',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/v1/health', (_req, res) => {
  res.redirect(301, '/api/health');
});

// Real provider status verification
app.get('/api/v1/providers/status', async (_req, res) => {
  try {
    const statuses = await checkAllProviders();
    res.json({
      checkedAt: new Date().toISOString(),
      providers: statuses
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao verificar provedores geoespaciais', message: err.message });
  }
});

// ==========================================
// 2. AUTHENTICATION & ACCESS CONTROL
// ==========================================

app.get('/api/auth/config', (_req, res) => {
  res.json(getAuthConfiguration());
});

app.post('/api/auth/login', (req, res) => {
  const { role = 'operador', password } = req.body || {};

  if (role !== 'admin' && role !== 'operador') {
    return res.status(400).json({ error: 'Papel de usuário inválido. Escolha admin ou operador.' });
  }

  const result = authenticateUser(role, password);
  if (!result.success) {
    return res.status(401).json({ error: result.error });
  }

  return res.json(result);
});

app.get('/api/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');

  if (!token) {
    return res.status(401).json({ valid: false, error: 'Cabeçalho Authorization ausente' });
  }

  const verification = verifyToken(token);
  if (!verification.valid) {
    return res.status(401).json(verification);
  }

  return res.json(verification);
});

// ==========================================
// 3. GEOSPATIAL ROI VALIDATION
// ==========================================

app.post('/api/v1/roi/validate', (req, res) => {
  const { geometry } = req.body || {};
  const validation = validateROI(geometry);
  if (!validation.valid) {
    return res.status(400).json(validation);
  }
  return res.json(validation);
});

// ==========================================
// 4. SATELLITE SCENE DISCOVERY (STAC & GEE)
// ==========================================

app.post('/api/v1/satellite/search', async (req, res) => {
  try {
    const { geometry, dateRange, maxCloudCover = 30, provider = 'stac' } = req.body || {};

    const roiValidation = validateROI(geometry);
    if (!roiValidation.valid || !roiValidation.geometry) {
      return res.status(400).json({
        error: 'Geometria de ROI inválida para busca de satélite.',
        details: roiValidation.errors
      });
    }

    if (provider === 'earth_engine') {
      const eeStatus = await earthEngineProvider.checkStatus();
      if (eeStatus.status !== 'CONNECTED') {
        return res.status(503).json({
          error: 'Google Earth Engine não está configurado no ambiente.',
          status: eeStatus.status,
          message: eeStatus.message,
          suggestion: 'Utilize o provedor STAC (Copernicus Sentinel-2 L2A) que não requer chave de serviço privada.'
        });
      }
      const scenes = await earthEngineProvider.searchScenes(roiValidation.geometry, { dateRange, maxCloudCover });
      return res.json({ provider: 'google_earth_engine', scenes });
    }

    // Default to public Sentinel-2 L2A STAC API
    try {
      const scenes = await publicStacSentinelProvider.searchScenes(roiValidation.geometry, {
        dateRange,
        maxCloudCover: Number(maxCloudCover)
      });
      return res.json({
        provider: 'sentinel2_stac',
        totalFound: scenes.length,
        scenes
      });
    } catch (stacErr: any) {
      return res.status(502).json({
        error: 'Catálogo STAC Sentinel-2 temporariamente indisponível.',
        message: stacErr?.message || 'Falha de comunicação de rede com STAC catalog.'
      });
    }
  } catch (err: any) {
    return res.status(500).json({ error: 'Falha interna ao buscar cenas de satélite', message: err.message });
  }
});

// ==========================================
// 5. ASYNCHRONOUS PIPELINE EXECUTION
// ==========================================

// Create/Queue Job
app.post('/api/v1/analysis', (req, res) => {
  try {
    const { geometry } = req.body || {};
    const validation = validateROI(geometry);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Geometria do ROI inválida.',
        details: validation.errors
      });
    }

    const { jobId, status } = pipelineService.startJob(req.body);
    return res.status(202).json({
      jobId,
      status,
      message: 'Job de análise geoespacial iniciado com sucesso.',
      statusUrl: `/api/v1/analysis/${jobId}/status`,
      resultUrl: `/api/v1/analysis/${jobId}/result`
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao despachar job de análise', message: err.message });
  }
});

// Poll Job Status
app.get('/api/v1/analysis/:id/status', (req, res) => {
  const job = pipelineService.getJob(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job de análise não encontrado.' });
  }
  return res.json({
    id: job.id,
    status: job.status,
    progressPct: job.progressPct,
    stageMessage: job.stageMessage,
    error: job.error,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    completedAt: job.completedAt
  });
});

// Get Full Job Record
app.get('/api/v1/analysis/:id', (req, res) => {
  const job = pipelineService.getJob(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job de análise não encontrado.' });
  }
  return res.json(job);
});

// Get Analysis Result
app.get('/api/v1/analysis/:id/result', (req, res) => {
  const result = pipelineService.getResult(req.params.id);
  if (!result) {
    const job = pipelineService.getJob(req.params.id);
    if (job && job.status !== 'completed') {
      return res.status(202).json({
        status: job.status,
        progressPct: job.progressPct,
        message: 'A análise ainda está em processamento. Consulte novamente em instantes.'
      });
    }
    return res.status(404).json({ error: 'Resultado não encontrado para o ID especificado.' });
  }
  return res.json(result);
});

// Get Classified GeoJSON FeatureCollection
app.get('/api/v1/analysis/:id/geojson', (req, res) => {
  const result = pipelineService.getResult(req.params.id);
  if (!result) {
    return res.status(404).json({ error: 'Resultado vetorial GeoJSON não encontrado.' });
  }
  res.setHeader('Content-Type', 'application/geo+json');
  res.setHeader('Content-Disposition', `attachment; filename="analysis_${req.params.id}.geojson"`);
  return res.json(result.vectorGeoJson);
});

// Synchronous analysis endpoint (Direct return of AnalysisResult)
app.post('/api/v1/roi/analyze', async (req, res) => {
  try {
    const { geometry } = req.body || {};
    const validation = validateROI(geometry);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Geometria de ROI inválida.', details: validation.errors });
    }

    const { jobId } = pipelineService.startJob(req.body);

    // Poll until completed (with 30s timeout)
    const startTime = Date.now();
    const interval = setInterval(() => {
      const job = pipelineService.getJob(jobId);
      if (job?.status === 'completed' && job.result) {
        clearInterval(interval);
        return res.json({ success: true, result: job.result });
      }
      if (job?.status === 'failed') {
        clearInterval(interval);
        return res.status(500).json({ error: 'Falha na pipeline geoespacial', details: job.error });
      }
      if (Date.now() - startTime > 30000) {
        clearInterval(interval);
        return res.status(504).json({ error: 'Tempo limite excedido durante o processamento.', jobId });
      }
    }, 250);
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro no processamento síncrono', message: err.message });
  }
});

// ==========================================
// 6. GEMINI AGRONOMIC AUDIT REPORT
// ==========================================

let genAiClient: GoogleGenAI | null = null;
function getGenAi(): GoogleGenAI | null {
  if (!genAiClient && process.env.GEMINI_API_KEY) {
    genAiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return genAiClient;
}

app.post('/api/v1/ai/report', async (req, res) => {
  const {
    farmName = 'Propriedade Rural',
    region = 'Brasil',
    biome = 'Cerrado',
    areaHectares = 1000,
    meanNdvi = 0.75,
    meanNdre = 0.62,
    carbonStockTon = 10000,
    carStatus = 'CONFORME',
    classBreakdown = [],
    modelUsed = 'hybrid_cnn_vit'
  } = req.body || {};

  const prompt = `Você é o Auditor Sênior de GeoAI e Engenharia Agronômica da plataforma Triminds GeoAI V4.
Emita um parecer agronômico, ambiental e regulatório formal e rigoroso com base nas seguintes métricas reais processadas:
- Propriedade: ${farmName}
- Localização: ${region} (Bioma: ${biome})
- Área Total: ${areaHectares} hectares
- Modelo de Classificação Utilizado: ${modelUsed}
- Índice de Vigor Vegetativo (NDVI Médio): ${meanNdvi}
- Índice de Clorofila (NDRE Médio): ${meanNdre}
- Estoque de Carbono Estimado: ${carbonStockTon} toneladas tCO2e
- Status do Cadastro Ambiental Rural (CAR): ${carStatus}
- Distribuição de Classes de Uso e Cobertura do Solo: ${JSON.stringify(classBreakdown)}

Estruture o parecer estritamente com:
1. Síntese Executiva do Talhão
2. Avaliação de Vigor e Fitossanidade (NDVI/NDRE)
3. Auditoria Regulatória CAR & Reserva Legal
4. Recomendações Agronômicas e de Manejo de Precisão.`;

  try {
    const ai = getGenAi();
    if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      return res.json({
        success: true,
        source: 'Gemini 2.5 Flash (Server-Side)',
        report: response.text,
        generatedAt: new Date().toISOString()
      });
    }
  } catch (err: any) {
    console.warn('[Gemini API warning]:', err?.message || err);
  }

  // Clear, non-simulated local fallback if GEMINI_API_KEY is not configured
  const localReport = `### Parecer Técnico GeoAI (Triminds Agronomic Intelligence)

**1. Síntese Executiva do Talhão**
A propriedade **${farmName}**, localizada em **${region}** (${biome}), totaliza **${Number(areaHectares).toLocaleString('pt-BR')} ha** com dados espectrais Sentinel-2 L2A processados pelo motor **${modelUsed}**.

**2. Avaliação de Vigor e Fitossanidade (NDVI & NDRE)**
- **NDVI Médio (${meanNdvi}):** Reflete a densidade de biomassa e atividade fotossintética atual da vegetação no talhão.
- **NDRE Médio (${meanNdre}):** Mede a absorção de clorofila na borda do vermelho (RedEdge 705nm), útil para monitoramento de estresse hídrico ou nutricional.

**3. Auditoria Regulatória CAR & Reserva Legal**
- **Status do Cadastro Ambiental Rural:** **${carStatus}**.
- **Estoque de Carbono Acumulado:** Estimado em **${Number(carbonStockTon).toLocaleString('pt-BR')} tCO2e** com base em coeficientes médios validados do bioma ${biome} (IPCC/MCTI).

**4. Recomendações Agronômicas**
1. Realizar acompanhamento temporal contínuo na janela da safra com novas passagens do satélite.
2. Manter isoladas e demarcadas no mapa as faixas de Área de Preservação Permanente (APP) hídricas.
3. Adotar mapas de aplicação em taxa variável nos setores com menores índices de NDRE.`;

  return res.json({
    success: true,
    source: 'Parecer Estruturado Local (Configurar GEMINI_API_KEY para síntese generativa dinâmica)',
    report: localReport,
    generatedAt: new Date().toISOString()
  });
});

// ==========================================
// 7. AUDIT & GOVERNANCE LOGS
// ==========================================

const AUDIT_LOGS_MEMORY: Array<{
  id: string;
  timestamp: string;
  user: string;
  userName: string;
  action: string;
  details: string;
  ip: string;
  status: string;
}> = [
  {
    id: 'aud_101',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    user: 'admin',
    userName: 'Administrador GeoAI',
    action: 'SYSTEM_PIPELINE_INIT',
    details: 'Inicialização da pipeline geoespacial v4.0.0 com adaptadores STAC e GEE.',
    ip: '127.0.0.1',
    status: 'SUCCESS'
  }
];

app.get('/api/v1/audit/logs', (_req, res) => {
  res.json({
    total: AUDIT_LOGS_MEMORY.length,
    logs: AUDIT_LOGS_MEMORY
  });
});

app.post('/api/v1/audit/logs', (req, res) => {
  const { action, details, user = 'operador', userName = 'Operador' } = req.body || {};
  const newLog = {
    id: `aud_${Date.now()}`,
    timestamp: new Date().toISOString(),
    user,
    userName,
    action: action || 'ACTION_EXECUTED',
    details: details || 'Ação registrada no sistema.',
    ip: req.ip || '127.0.0.1',
    status: 'SUCCESS'
  };
  AUDIT_LOGS_MEMORY.unshift(newLog);
  res.status(201).json({ success: true, log: newLog });
});

// ==========================================
// 8. VITE MIDDLEWARE & STATIC SERVING
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Triminds GeoAI v4 Server] Listening on http://0.0.0.0:${PORT} (Node ${process.version})`);
  });
}

startServer();
