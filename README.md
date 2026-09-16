# Triminds Geo AI - Satellite Earth Observation & LULC Platform

<p align="center">
  <img width="100%" style="border-radius: 12px; margin: 16px 0;" alt="Triminds Geo AI Satellite Earth Observation" src="https://github.com/user-attachments/assets/291af6bb-21c5-437b-ab41-734048ddb39f" />
</p>

Plataforma de inteligência artificial geoespacial avançada para classificação e monitoramento contínuo de Uso e Cobertura da Terra (**LULC - Land Use and Land Cover**), adaptada para biomas brasileiros (Cerrado, Amazônia, Mata Atlântica, Pantanal e Pampa), com suporte nativo ao **Google Satellite Embedding V1 (64-Band Latents)**, **Sentinel-2 L2A (10m)** e integração com **Google Earth Engine (GEE)** e **Google Maps Platform**.

---

## 🏛️ Arquitetura do Sistema

O sistema é construído sobre uma arquitetura **Full-Stack desacoplada e conteinerizada**, pronta para execução em alta performance no **Google Cloud Run**:

```
 ┌────────────────────────────────────────────────────────┐
 │                      FRONTEND                          │
 │  React 19 + TypeScript + Tailwind CSS v4 + Motion      │
 │  - GeoAI Inference Studio (Seleção por bioma e talhão) │
 │  - Seleção no Mapa ROI (Google Earth Engine & Maps)    │
 │  - Mapeamento Hectares, CAR & Reserva Legal            │
 │  - Série Temporal Multitemporal & Análise de Vigor     │
 │  - Model Zoo (ViT, ResNet-50, Swin, ConvNeXt-Geo)      │
 │  - Observabilidade MLOps & Data Drift                  │
 │  - API Workbench & Swagger/OpenAPI Client              │
 │  - Governança, RBAC e Trilha de Auditoria              │
 └──────────────────────────┬─────────────────────────────┘
                            │  Proxy /api/* (Port 3000)
 ┌──────────────────────────▼─────────────────────────────┐
 │                      BACKEND                           │
 │  Node.js + Express + TypeScript (tsx em dev, esbuild)  │
 │  - /api/auth/login, /api/auth/verify (RBAC Seguro)     │
 │  - /api/v1/predict (Inferência LULC com Tensores 64-ch)│
 │  - /api/v1/roi/analyze (Cálculo de Hectares & CAR)     │
 │  - /api/v1/ai/report (Google GenAI Gemini 3.8 Flash)   │
 │  - /api/v1/health & GPU Status (Triton / TensorRT-LLM) │
 │  - /api/v1/models & /api/v1/classes (Taxonomia EuroSAT)│
 │  - /api/v1/audit/logs (Auditoria de Ações & Governança)│
 └──────────────────────────┬─────────────────────────────┘
                            │
 ┌──────────────────────────▼─────────────────────────────┐
 │            INFRAESTRUTURA & TELEMETRIA                 │
 │  - Google Earth Engine (Sentinel-2 L2A BOA)            │
 │  - Google Satellite Embedding V1 (64 Canais Latentes)  │
 │  - Google GenAI SDK (@google/genai, Gemini 3.8 Flash)  │
 │  - Google Cloud Run (Single-Port 3000, 0.0.0.0 host)   │
 └────────────────────────────────────────────────────────┘
```

---

## 🔐 Controle de Acesso Baseado em Papéis (RBAC)

O sistema implementa dois perfis estritos de acesso, com permissões distintas de governança:

| Perfil | Usuário | Senha Padrão | Permissões & Capacidades | Restrições |
| :--- | :--- | :--- | :--- | :--- |
| **Administrador** | `admin` | `agentic` | • Acesso total a todas as abas e ferramentas<br>• Geração e exportação exclusiva de **Relatórios Técnicos (PDF, GeoJSON, Shapefile)**<br>• Re-treinamento e ativação de checkpoints no Model Zoo<br>• Gerenciamento de alertas de Data Drift e Drift de Rótulos<br>• Visualização e auditoria completa de logs de segurança | Nenhuma |
| **Operador** | `operador` | `funcionario` | • Manipulação e busca de imagens de satélite por bioma<br>• Escolha de regiões no mapa (GEE / Google Maps)<br>• Execução de testes de inferência no GeoAI Studio<br>• Ajuste de parâmetros de bounding box, NDVI e NDRE<br>• Execução de requisições de teste no API Workbench | ❌ **Não gera relatórios**<br>❌ Sem permissão de exportar Shapefiles/PDFs<br>❌ Bloqueado para alterar modelos de produção |

---

## 🚀 Endpoints da API Backend

Todos os endpoints operam em `/api` sob o prefixo `/api/v1`, garantindo compatibilidade com clientes REST, Python SDK e pipelines GIS:

### 1. Autenticação & Sessão

- **`POST /api/auth/login`**
  - Autentica o usuário pelo perfil (`admin` ou `operador`) e senha.
  - Retorna o token de autorização e perfil do usuário.
- **`GET /api/auth/verify`**
  - Valida o token Bearer no cabeçalho `Authorization`.
- **`POST /api/auth/logout`**
  - Encerra a sessão ativa.

### 2. Pipeline Geoespacial Real & Inferência LULC (v4)

- **`POST /api/v1/analysis`**
  - Enfileira uma execução assíncrona na pipeline geoespacial v4.
  - Valida BBox/GeoJSON, consulta cenas Sentinel-2 via STAC/GEE, processa tensores espectrais e executa classificação LULC.
  - Retorna `jobId` para acompanhamento de progresso.

- **`GET /api/v1/analysis/:id/status`**
  - Consulta o estado e progresso em tempo real da pipeline (`queued`, `validating_roi`, `searching_satellite`, `acquiring_raster`, `computing_indices`, `running_inference`, `spatial_statistics`, `generating_evidence`, `completed`).

- **`GET /api/v1/analysis/:id/result`**
  - Retorna o resultado analítico consolidado (métricas espectrais NDVI/NDRE/EVI, hectares por classe, conformidade CAR, auditoria de carbono IPCC/MCTI e proveniência).

- **`GET /api/v1/analysis/:id/geojson`**
  - Exporta os vetores de polígonos de classificação LULC em padrão GeoJSON RFC 7946 (EPSG:4326).

- **`POST /api/v1/satellite/search`**
  - Consulta cenas reais de satélite Sentinel-2 L2A via catálogo STAC público (Earth Search AWS) ou Google Earth Engine filtradas por geometria, data e cobertura de nuvens.

- **`GET /api/v1/providers/status`**
  - Diagnóstico em tempo real da conectividade com provedores (Earth Engine, STAC Sentinel-2, Motor de Inferência).

### 3. Análise Espacial de Área de Interesse (ROI)

- **`POST /api/v1/roi/analyze`**
  - Delimitação da região por Bounding Box, fonte (GEE, Google Satellite Embedding, PlanetScope) e formato (COG, Zarr, GeoJSON).
  - Calcula a área total em hectares, quebra percentual de classes de cobertura, índices de vegetação (NDVI/NDRE médios), estoque de carbono e auditoria CAR.
  - **Payload de exemplo:**
    ```json
    {
      "sourceType": "google_earth_engine",
      "sourceFormat": "cog_float32",
      "center": { "lat": -12.5428, "lng": -55.7214 },
      "widthKm": 5.0,
      "lengthKm": 5.0,
      "model": "hybrid_cnn_vit"
    }
    ```

### 4. Inteligência Agronômica com Gemini (Server-Side)

- **`POST /api/v1/ai/report`**
  - Geração de parecer agronômico e ambiental detalhado via Google GenAI (`gemini-3.8-flash`) no servidor.
  - Mantém a chave `GEMINI_API_KEY` segura no backend (nunca exposta ao navegador).
  - Inclui avaliação fitossanitária, conformidade CAR e recomendações de manejo de precisão.

### 5. Health Check & Observabilidade MLOps

- **`GET /api/v1/health`**
  - Status de integridade do cluster, aceleração GPU, VRAM alocada e conectividade com Google Earth Engine.
- **`GET /api/v1/models`**
  - Catálogo de modelos de Deep Learning disponíveis com latência, F1-Score e canais suportados.
- **`GET /api/v1/classes`**
  - Relação das 10 classes taxonômicas EuroSAT/LULC com cores hexadecimais e fatores de carbono.
- **`GET /api/v1/audit/logs` & `POST /api/v1/audit/logs`**
  - Consulta e registro de ações sensíveis na trilha de auditoria (Compliance ISO 27001 / LGPD).

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
# Chave de API Google Gemini (usada exclusivamente no backend server-side)
GEMINI_API_KEY="sua_chave_gemini_aqui"

# URL pública da aplicação (injetada automaticamente no Cloud Run)
APP_URL="https://meu-app.run.app"
```

### 3. Modo de Desenvolvimento
Inicia o servidor Express integrado com o middleware Vite na porta 3000:
```bash
npm run dev
```
Acesse em seu navegador: **http://localhost:3000**

---

## 📦 Build & Deploy no Google Cloud Run

A aplicação está configurada para deploy automático em containers sem etapas manuais complexas:

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
Inicia `node dist/server.cjs` escutando em **`0.0.0.0:3000`**, atendendo rigorosamente aos requisitos do Google Cloud Run e proxies reversos.

---

## 🛰️ Tecnologias Geoespaciais Suportadas

- **Google Satellite Embedding V1:** Embeddings espaciais de 64 canais latentes com 10m de GSD.
- **Sentinel-2 L2A (Copernicus / GEE):** Bandas B02, B03, B04 (RGB), B08 (NIR) e B05/B06/B07 (Red Edge).
- **Landsat 9 OLI-2 / TIRS-2 (USGS):** Bandas multiespectrais e termais (30m/100m).
- **PlanetScope SuperDove:** Constelação Planet de alta frequência diária (3m).
- **Formatos Matriciais & Vetoriais:** Cloud-Optimized GeoTIFF (COG Float32), Zarr Multidimensional Arrays, Shapefile e GeoJSON (WGS84 EPSG:4326).
