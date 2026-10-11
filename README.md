# Triminds Geo AI V4 - Satellite Earth Observation & Geospatial Intelligence Platform

<p align="center">
  <img width="100%" style="border-radius: 12px; margin: 16px 0;" alt="Triminds Geo AI Satellite Earth Observation" src="https://github.com/user-attachments/assets/291af6bb-21c5-437b-ab41-734048ddb39f" />
</p>

Plataforma de inteligência geoespacial operacional conectada a dados reais de satélite Copernicus Sentinel-2 L2A, projetada para monitoramento de Uso e Cobertura da Terra (**LULC - Land Use and Land Cover**), cálculo determinístico de índices de vegetação (NDVI, NDRE, EVI), conformidade com o Cadastro Ambiental Rural (**CAR**), auditoria de carbono (IPCC Tier 1 / MCTI) e pareceres agronômicos com Google Gemini.

> **Princípio Fundamental:** Dados reais na entrada → Processamento determinístico rastreável → Evidências e proveniência na saída.

---

## 🏛️ Arquitetura Operacional do Sistema

O sistema é construído sobre uma arquitetura **Full-Stack desacoplada e conteinerizada**, pronta para execução com latência previsível no **Google Cloud Run**:

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                              FRONTEND                                  │
 │  React 19 + TypeScript + Tailwind CSS v4 + Motion                      │
 │  - Seleção no Mapa ROI (BBox / Polígono GeoJSON)                       │
 │  - Consulta e Descoberta de Cenas Reais de Satélite                    │
 │  - Pipeline Monitor com rastreabilidade de estágios em tempo real      │
 │  - Análise Espectral (NDVI, NDRE, EVI com paletas científicas)         │
 │  - Auditoria Regulatória CAR & Estoque de Carbono (IPCC Tier 1)        │
 │  - Exportação em GeoJSON RFC 7946 (EPSG:4326), CSV e Laudos Técnicos   │
 │  - Trilha de Auditoria e Governança de Acessos                         │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │  Proxy /api/* (Porta 3000)
 ┌───────────────────────────────────▼────────────────────────────────────┐
 │                              BACKEND                                   │
 │  Node.js 20+ + Express + TypeScript (tsx em dev, esbuild em prod)     │
 │  - /api/v1/satellite/search: Descoberta STAC Sentinel-2 L2A            │
 │  - /api/v1/analysis: Orquestração assíncrona da pipeline               │
 │  - /api/v1/analysis/:id/status: Acompanhamento de estágios             │
 │  - /api/v1/analysis/:id/result: Métricas, índices e proveniência       │
 │  - /api/v1/analysis/:id/geojson: Exportação vetorial GeoJSON           │
 │  - /api/v1/providers/status: Verificação real de catálogo STAC e GEE   │
 │  - /api/v1/health: Observabilidade de runtime e capacidades reais      │
 │  - /api/v1/ai/report: Parecer técnico via Google Gemini 2.5 Flash      │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
 ┌───────────────────────────────────▼────────────────────────────────────┐
 │                     MOTOR ESPECTRAL & DADOS REAIS                      │
 │  - AWS Earth Search STAC: Descoberta de cenas Sentinel-2 L2A           │
 │  - Cloud-Optimized GeoTIFFs (COG): Extração de pixels reais via geotiff│
 │  - Reprojeção geodésica precisa via proj4 (UTM <-> WGS84)              │
 │  - Motor Espectral Determinístico CPU / Float32Array SIMD              │
 │  - Google GenAI SDK (@google/genai, Gemini 2.5 Flash Server-Side)      │
 └────────────────────────────────────────────────────────────────────────┘
```

---

## 🛰️ Pipeline Geoespacial Real End-to-End (v4)

A pipeline v4 executa as seguintes etapas determinísticas para cada análise submetida:

1. **Validação de ROI / Geometria:** Validação de Bounding Box ou polígono GeoJSON em coordenadas WGS84 (EPSG:4326), calculando a área exata em hectares.
2. **Descoberta de Cenas Satelitais:** Consulta ao catálogo STAC público (Earth Search AWS) buscando cenas reais Sentinel-2 L2A com cobertura de nuvens aceitável e interseção geográfica.
3. **Extração de Bandas Espectrais (COG):** Download e decodificação seletiva das bandas ópticas (B02 Azul, B03 Verde, B04 Vermelho, B08 Infravermelho Próximo/NIR e B05 Borda do Vermelho/RedEdge) diretamente de Cloud-Optimized GeoTIFFs.
4. **Cálculo de Índices de Vegetação:**
   - $\text{NDVI} = \frac{\text{NIR} - \text{Red}}{\text{NIR} + \text{Red}}$
   - $\text{NDRE} = \frac{\text{NIR} - \text{RedEdge}}{\text{NIR} + \text{RedEdge}}$
   - $\text{EVI} = 2.5 \times \frac{\text{NIR} - \text{Red}}{\text{NIR} + 6 \times \text{Red} - 7.5 \times \text{Blue} + 1}$
   - Estatísticas completas: Média, Mínimo, Máximo, Mediana, Desvio Padrão e Histograma em 10 bins.
5. **Classificação Espectral de Uso e Cobertura do Solo (LULC):** Regras calibradas por limiares espectrais (NDVI, NDRE, refletâncias relativas) para estimar proporções de Floresta, Lavoura Anual, Pastagem, Vegetação Herbácea, Rios e Infraestrutura.
6. **Auditoria Regulatória e de Carbono:**
   - Conformidade com o percentual de Reserva Legal do Código Florestal Brasileiro (80% Amazônia, 35% Cerrado na Amazônia Legal, 20% demais biomas).
   - Estimativa de estoque de carbono segundo metodologia IPCC 2006 (AFOLU Tier 1) e 4ª Comunicação Nacional do Brasil (MCTI / SIRENE).
7. **Geração de Evidências & Proveniência:** Registro do Scene ID exato, data de aquisição do satélite, percentual real de cobertura de nuvens, URI dos assets COG, hashes SHA-256 e disclaimers técnicos.
8. **Parecer Agronômico com Gemini (Opcional):** Se a variável `GEMINI_API_KEY` estiver configurada, o backend gera um parecer técnico fundamentado nas evidências espectrais reais coletadas. Se não estiver configurada, retorna explicitamente `AI_PROVIDER_UNAVAILABLE` sem inventar laudos fictícios.

---

## 🔐 Controle de Acesso Baseado em Papéis (RBAC)

O sistema implementa dois perfis de acesso no backend (`POST /api/auth/login`). **Atenção:** `server/auth.ts` contém senhas e segredo de assinatura padrão para desenvolvimento (`agentic`, `funcionario` e um segredo fixo). A implantação deve sobrescrever `AUTH_SECRET`, `ADMIN_PASSWORD` e `OPERATOR_PASSWORD` com valores fortes e únicos via Secret Manager; não trate os defaults do repositório como seguros para produção.

| Perfil | Identificador (Role) | Permissões & Capacidades | Restrições |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin` | • Acesso total a todas as visões e ferramentas<br>• Geração e exportação de **Relatórios Técnicos (PDF, GeoJSON)**<br>• Visualização e auditoria completa de logs de segurança<br>• Gestão de provedores e telemetria do sistema | Nenhuma |
| **Operador** | `operator` / `operador` | • Seleção e busca de imagens de satélite reais<br>• Execução de análises na pipeline geoespacial<br>• Inspeção de índices de vegetação e histogramas<br>• Execução de requisições de teste no API Workbench | ❌ Sem permissão para exportar relatórios executivos<br>❌ Sem acesso a configurações administrativas |

---

## 🚀 Endpoints da API Backend (v4)

Todos os endpoints operam sob o prefixo `/api` e `/api/v1`:

### 1. Observabilidade & Provedores
- **`GET /api/v1/health`**
  - Retorna o status de integridade do runtime Node.js, versão da API, métricas de memória e capacidades do motor espectral (Float32Array / CPU SIMD).
- **`GET /api/v1/providers/status`**
  - Verifica a conectividade do catálogo STAC e do endpoint Google Earth Engine. A conectividade do Earth Engine não significa que a busca de cenas via Earth Engine esteja implementada; atualmente esse adaptador retorna uma lista vazia quando conectado. A descoberta de cenas implementada usa o catálogo STAC público.

### 2. Descoberta & Pipeline Geoespacial Real
- **`POST /api/v1/satellite/search`**
  - Consulta cenas reais Sentinel-2 L2A com Cloud-Optimized GeoTIFFs por bounding box ou polígono GeoJSON.
- **`POST /api/v1/analysis`**
  - Enfileira uma execução assíncrona na pipeline geoespacial real.
  - Retorna `jobId` e `status: "queued"`.
- **`GET /api/v1/analysis/:id/status`**
  - Consulta o estado e progresso em tempo real da pipeline (`queued`, `validating_roi`, `searching_satellite`, `acquiring_raster`, `computing_indices`, `running_inference`, `spatial_statistics`, `generating_evidence`, `completed` ou `failed`).
- **`GET /api/v1/analysis/:id/result`**
  - Retorna o resultado analítico consolidado (estatísticas de NDVI/NDRE/EVI, hectares por classe, conformidade CAR, auditoria de carbono IPCC/MCTI e proveniência do satélite).
- **`GET /api/v1/analysis/:id/geojson`**
  - Exporta os vetores de classificação LULC no formato padronizado GeoJSON RFC 7946 (EPSG:4326).

### 3. Inteligência Agronômica com Gemini (Server-Side)
- **`POST /api/v1/ai/report`**
  - Síntese técnica fundamentada nas evidências da análise via Google Gemini 2.5 Flash no backend.
  - Se `GEMINI_API_KEY` não estiver definida, responde com HTTP 503 e código `AI_PROVIDER_UNAVAILABLE`.

### 4. Autenticação & Trilha de Auditoria
- **`POST /api/auth/login`**: Autentica o usuário pelo perfil (`admin` ou `operador`).
- **`GET /api/auth/verify`**: Valida o token Bearer ativo.
- **`GET /api/v1/audit/logs` & `POST /api/v1/audit/logs`**: Consulta e registro de ações sensíveis na trilha de auditoria.

---

## 🗺️ Roadmap & Arquitetura Futura (Deep Learning / GPU)

As capacidades listadas abaixo estão planejadas para versões futuras e **não** fazem parte do runtime de CPU em produção atual:

- **Modelos Deep Learning LULC:** Backbones ViT-B/16, ResNet-50 e Swin Transformer treinados especificamente em mosaicos multiespectrais continentais.
- **Servidores de Inferência GPU:** Suporte planejado a Triton Inference Server e aceleração TensorRT em instâncias de GPU NVIDIA (A100/T4) na nuvem.
- **Integração Google Earth Engine Enterprise:** Conector bidirecional via Service Account para processamento de séries temporais de 30 anos em larga escala.

---

## 💻 Instalação & Execução Local

### Pré-requisitos
- Node.js 20+ ou 22+
- NPM ou Bun

### 1. Clonar o repositório e instalar dependências
```bash
git clone <url-do-repositorio>
cd triminds-geoai
npm install
```

### 2. Configurar variáveis de ambiente
Crie um arquivo `.env` baseado em `.env.example`:
```bash
cp .env.example .env
```
Variáveis disponíveis:
```env
# Chave da API Google Gemini (usada exclusivamente no backend server-side)
GEMINI_API_KEY=""

# Credenciais opcionais para Google Earth Engine
EARTH_ENGINE_SERVICE_ACCOUNT=""
EARTH_ENGINE_PRIVATE_KEY=""

# URL pública da aplicação
APP_URL="http://localhost:3000"
```

### 3. Modo de Desenvolvimento
Inicia o servidor Express integrado ao Vite na porta 3000:
```bash
npm run dev
```
Acesse em seu navegador: **http://localhost:3000**

---

## 📦 Build & Deploy no Google Cloud Run

O workflow `.github/workflows/deploy.yml` dispara deploy para Cloud Run em pushes a `main`/`master`. No estado atual, não executa testes/lint como gates de release e a chamada de health check é informativa, não bloqueante. Além disso, `server.ts` escuta na porta fixa 3000 enquanto o `Dockerfile` declara `PORT=8080`, uma divergência de configuração que exige correção e teste do container antes de confirmar a prontidão em Cloud Run. Um workflow concluído não garante que o serviço passou por uma verificação de saúde bloqueante.

### Compilação de Produção
```bash
npm run build
```
O comando executa:
1. `vite build` — Gera a SPA estática em `dist/`.
2. `esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs` — Empacota o servidor Express em um único arquivo CJS autônomo.

### Inicialização em Produção
```bash
npm start
```
Inicia `node dist/server.cjs`. A divergência de porta descrita acima precisa ser corrigida e validada antes de promover a imagem para Cloud Run.
