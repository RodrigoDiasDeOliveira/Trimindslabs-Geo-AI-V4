import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { 
  Terminal, 
  Send, 
  Copy, 
  CheckCircle2, 
  Code, 
  Globe, 
  Cpu, 
  Layers,
  FileCode
} from 'lucide-react';

interface EndpointConfig {
  id: string;
  name: string;
  method: 'POST' | 'GET';
  path: string;
  description: string;
  defaultPayload?: string;
  mockResponse: object;
}

const ENDPOINTS: EndpointConfig[] = [
  {
    id: 'health',
    name: 'Health Check & Runtime Status',
    method: 'GET',
    path: '/api/v1/health',
    description: 'Retorna a integridade do runtime Node.js, versão da API v4, métricas de memória e capacidades do motor espectral.',
    mockResponse: {
      status: "healthy",
      apiVersion: "4.0.0",
      service: "Triminds-Geo-AI-V4-Core",
      runtime: {
        nodeVersion: "v20.x",
        platform: "linux (x64)",
        cpuCount: 4
      },
      hardwareAcceleration: {
        gpuAvailable: false,
        executionEngine: "Node.js V8 SIMD / Float32Array (CPU Deterministic)"
      },
      processingCapabilities: [
        "SENTINEL2_COG_SPECTRAL_EXTRACTION",
        "DETERMINISTIC_VEGETATION_INDICES",
        "RULE_BASED_SPECTRAL_LULC",
        "IPCC_TIER1_CARBON_AUDIT",
        "CAR_COMPLIANCE_INDICATOR"
      ]
    }
  },
  {
    id: 'providers_status',
    name: 'Status dos Provedores Satelitais',
    method: 'GET',
    path: '/api/v1/providers/status',
    description: 'Verifica em tempo real a conectividade com o catálogo STAC Sentinel-2 (Earth Search) e Google Earth Engine.',
    mockResponse: {
      checkedAt: new Date().toISOString(),
      providers: [
        {
          id: "sentinel_stac",
          name: "Copernicus Sentinel-2 L2A (STAC AWS)",
          status: "AVAILABLE",
          message: "Catálogo STAC operacional via AWS Earth Search."
        },
        {
          id: "earth_engine",
          name: "Google Earth Engine (GEE API)",
          status: "NOT_CONFIGURED",
          message: "Defina EARTH_ENGINE_SERVICE_ACCOUNT para habilitar."
        }
      ]
    }
  },
  {
    id: 'satellite_search',
    name: 'Consultar Cenas Sentinel-2 L2A (STAC)',
    method: 'POST',
    path: '/api/v1/satellite/search',
    description: 'Consulta cenas reais Sentinel-2 L2A com Cloud-Optimized GeoTIFFs para um bounding box ou polígono GeoJSON.',
    defaultPayload: JSON.stringify({
      geometry: [-55.75, -12.55, -55.70, -12.50],
      maxCloudCover: 30,
      provider: "stac"
    }, null, 2),
    mockResponse: {
      provider: "sentinel_stac",
      count: 1,
      scenes: [
        {
          id: "S2B_21LXG_20260912_0_L2A",
          collection: "sentinel-2-l2a",
          datetime: "2026-09-12T14:15:32Z",
          cloudCoverPct: 12.4,
          bandsAvailable: ["B02", "B03", "B04", "B08", "B05", "B11"]
        }
      ]
    }
  },
  {
    id: 'analysis_start',
    name: 'Iniciar Pipeline Geoespacial Real',
    method: 'POST',
    path: '/api/v1/analysis',
    description: 'Submete um job assíncrono para processar tensores espectrais reais Sentinel-2 COG, calcular NDVI/NDRE/EVI e LULC.',
    defaultPayload: JSON.stringify({
      farmName: "Fazenda Santa Helena",
      regionName: "Sorriso - MT",
      biome: "Cerrado",
      geometry: [-55.75, -12.55, -55.70, -12.50],
      maxCloudCover: 30,
      selectedModel: "rule_based_spectral_v4"
    }, null, 2),
    mockResponse: {
      jobId: "geoai_1726484000_a1b2c3d4",
      status: "queued",
      message: "Job de análise geoespacial submetido com sucesso."
    }
  },
  {
    id: 'ai_report',
    name: 'Parecer Agronômico IA (Google GenAI Gemini)',
    method: 'POST',
    path: '/api/v1/ai/report',
    description: 'Aciona o modelo Gemini 2.5 Flash no servidor para elaborar laudo agronômico e análise de evidências.',
    defaultPayload: JSON.stringify({
      farmName: "Fazenda Santa Helena",
      region: "Sorriso - MT",
      biome: "Cerrado",
      areaHectares: 3250,
      meanNdvi: 0.74,
      meanNdre: 0.49,
      carbonStockTon: 185000,
      carStatus: "CONFORME",
      modelUsed: "Rule-Based Spectral LULC v4"
    }, null, 2),
    mockResponse: {
      success: true,
      source: "Google Gemini 2.5 Flash",
      report: "Síntese executiva elaborada a partir de evidências espectrais reais..."
    }
  }
];

export const ApiWorkbenchView: React.FC = () => {
  const { language, t } = useLanguage();
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>('predict');
  const [requestPayload, setRequestPayload] = useState<string>(ENDPOINTS[0].defaultPayload || '');
  const [responseOutput, setResponseOutput] = useState<object | null>(ENDPOINTS[0].mockResponse);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [lastStatusCode, setLastStatusCode] = useState<number | null>(200);
  const [latencyMs, setLatencyMs] = useState<number | null>(34);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [codeLanguage, setCodeLanguage] = useState<'python' | 'curl' | 'js'>('python');

  const selectedEndpoint = ENDPOINTS.find(e => e.id === selectedEndpointId) || ENDPOINTS[0];

  const handleSendRequest = async () => {
    setIsSending(true);
    const start = performance.now();
    try {
      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer triminds_dev_token'
        }
      };

      if (selectedEndpoint.method === 'POST' && requestPayload) {
        options.body = requestPayload;
      }

      const res = await fetch(selectedEndpoint.path, options);
      const data = await res.json();
      const elapsed = Math.round(performance.now() - start);
      setLatencyMs(elapsed);
      setLastStatusCode(res.status);
      setResponseOutput(data);
    } catch {
      // Fallback to local mock if server isn't serving this path or offline
      const elapsed = Math.round(performance.now() - start);
      setLatencyMs(elapsed);
      setLastStatusCode(200);
      setResponseOutput(selectedEndpoint.mockResponse);
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectEndpoint = (endpoint: EndpointConfig) => {
    setSelectedEndpointId(endpoint.id);
    setRequestPayload(endpoint.defaultPayload || '');
    setResponseOutput(endpoint.mockResponse);
  };

  const pythonSnippet = `import requests

url = "https://geoai.triminds.io${selectedEndpoint.path}"
headers = {
    "Authorization": "Bearer $TRIMINDS_API_KEY",
    "Content-Type": "application/json"
}

${selectedEndpoint.method === 'POST' ? `payload = ${requestPayload || '{}'}
response = requests.post(url, json=payload, headers=headers)` : `response = requests.get(url, headers=headers)`}

print(response.status_code)
print(response.json())`;

  const curlSnippet = `curl -X ${selectedEndpoint.method} "https://geoai.triminds.io${selectedEndpoint.path}" \\
  -H "Authorization: Bearer $TRIMINDS_API_KEY" \\
  -H "Content-Type: application/json"${selectedEndpoint.method === 'POST' ? ` \\
  -d '${requestPayload.replace(/\n/g, '')}'` : ''}`;

  const jsSnippet = `const response = await fetch("https://geoai.triminds.io${selectedEndpoint.path}", {
  method: "${selectedEndpoint.method}",
  headers: {
    "Authorization": "Bearer " + process.env.TRIMINDS_API_KEY,
    "Content-Type": "application/json"
  }${selectedEndpoint.method === 'POST' ? `,
  body: JSON.stringify(${requestPayload || '{}'})` : ''}
});

const data = await response.json();
console.log(data);`;

  const getActiveCode = () => {
    if (codeLanguage === 'python') return pythonSnippet;
    if (codeLanguage === 'curl') return curlSnippet;
    return jsSnippet;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Terminal className="w-6 h-6" />
            </span>
            {t.api.title}
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-1 max-w-3xl">
            {t.api.subtitle}
          </p>
        </div>

        <span className="text-xs px-3 py-1.5 rounded-full bg-slate-900 text-emerald-400 border border-slate-800 font-mono">
          FastAPI OpenAPI 3.1 • TLS 1.3
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Endpoint Navigation & Request Workbench */}
        <div className="lg:col-span-6 space-y-6">
          {/* Endpoints List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Endpoints Disponíveis
            </span>
            <div className="space-y-2">
              {ENDPOINTS.map(ep => {
                const isSelected = ep.id === selectedEndpointId;
                return (
                  <button
                    key={ep.id}
                    id={`btn-endpoint-${ep.id}`}
                    onClick={() => handleSelectEndpoint(ep)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                          ep.method === 'POST' ? 'bg-sky-500/20 text-sky-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {ep.method}
                        </span>
                        <span className="text-xs font-bold font-mono text-slate-200">{ep.path}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-1">{ep.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Request Editor & Send Button */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t.api.payload}
              </span>
              <button
                id="btn-execute-api"
                onClick={handleSendRequest}
                disabled={isSending}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:scale-95 transition-all shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
              >
                {isSending ? (
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{t.api.sendRequest}</span>
              </button>
            </div>

            {selectedEndpoint.method === 'POST' ? (
              <textarea
                value={requestPayload}
                onChange={(e) => setRequestPayload(e.target.value)}
                rows={10}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500 leading-relaxed resize-none"
              />
            ) : (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 font-mono">
                Nenhum corpo de requisição necessário para requisições GET.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Response JSON & Code Samples */}
        <div className="lg:col-span-6 space-y-6">
          {/* Response Payload Viewer */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-xs font-bold text-white uppercase tracking-wider">{t.api.response}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="text-emerald-400 font-bold">Status {lastStatusCode || 200}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">{latencyMs || 25}ms</span>
              </div>
            </div>

            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-sky-300 overflow-x-auto max-h-72 leading-relaxed">
              {JSON.stringify(responseOutput, null, 2)}
            </pre>
          </div>

          {/* Integration Code Generator */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Code className="w-4 h-4 text-purple-400" />
                {t.api.codeSamples}
              </span>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                  <button
                    onClick={() => setCodeLanguage('python')}
                    className={`px-2 py-0.5 rounded font-mono transition-all ${
                      codeLanguage === 'python' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Python
                  </button>
                  <button
                    onClick={() => setCodeLanguage('curl')}
                    className={`px-2 py-0.5 rounded font-mono transition-all ${
                      codeLanguage === 'curl' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    cURL
                  </button>
                  <button
                    onClick={() => setCodeLanguage('js')}
                    className={`px-2 py-0.5 rounded font-mono transition-all ${
                      codeLanguage === 'js' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    JavaScript
                  </button>
                </div>

                <button
                  id="btn-copy-api-code"
                  onClick={handleCopyCode}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title={t.common.copyCode}
                >
                  {copiedCode ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-purple-300 overflow-x-auto leading-relaxed">
              {getActiveCode()}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
