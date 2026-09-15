import { AuditPhase, DataLineageNode, GovernanceGate } from '../types';

export const AUDIT_PHASES: AuditPhase[] = [
  {
    id: 'phase1',
    number: 1,
    title: {
      'pt-BR': 'Fase 1: Auditoria de Repositório & Arquitetura',
      en: 'Phase 1: Repository & Architecture Audit',
      es: 'Fase 1: Auditoría de Repositorio y Arquitectura'
    },
    initialStatus: 'PASS',
    finalStatus: 'PRODUCTION_READY',
    summary: {
      'pt-BR': 'Arquitetura Feature-First + Provider-Based estritamente desacoplada com contratos Pydantic, isolamento de experimentos e hierarquia de exceções.',
      en: 'Strictly decoupled Feature-First + Provider-Based architecture with Pydantic contracts, experimental isolation, and typed exceptions.',
      es: 'Arquitectura Feature-First + Provider-Based desacoplada con contratos Pydantic, aislamiento experimental y excepciones tipadas.'
    },
    keyFixes: [
      {
        title: {
          'pt-BR': 'Contrato entre Camadas (Provider → Ingestion → GeoEngine → Model)',
          en: 'Layer Contracts (Provider → Ingestion → GeoEngine → Model)',
          es: 'Contrato entre Capas (Provider → Ingestion → GeoEngine → Model)'
        },
        description: {
          'pt-BR': 'Definição de interfaces abstratas BaseRasterProvider e BaseFeatureExtractor impedindo vazamento de dependências entre camadas.',
          en: 'Abstract interfaces BaseRasterProvider & BaseFeatureExtractor preventing leaky abstractions between ingestion and modeling.',
          es: 'Interfaces abstractas BaseRasterProvider y BaseFeatureExtractor impidiendo fuga de dependencias.'
        },
        status: 'VERIFIED',
        codeSnippet: `class BaseGeoProvider(ABC):
    @abstractmethod
    async def fetch_raster_tensor(self, bbox: BoundingBox, crs: str) -> GeoTensor:
        """Contrato estrito de ingestão geoespacial multi-banda."""
        pass`
      },
      {
        title: {
          'pt-BR': 'Tratamento de Exceções & Logging Estruturado',
          en: 'Structured Exception Hierarchy & JSON Logging',
          es: 'Jerarquía de Excepciones y Logging Estructurado'
        },
        description: {
          'pt-BR': 'Subclasses de GeoAIException (SpatialResolutionMismatchError, TensorDimensionError, ChecksumMismatchError) com tracebacks e correlation-id.',
          en: 'Custom GeoAIException classes with structured correlation-id for full distributed tracing.',
          es: 'Subclases de GeoAIException con correlation-id para rastreo distribuido.'
        },
        status: 'RESOLVED'
      }
    ]
  },
  {
    id: 'phase2',
    number: 2,
    title: {
      'pt-BR': 'Fase 2: Pipeline de Dados & Linhagem (Data Lineage)',
      en: 'Phase 2: Data & ML Pipeline Lineage',
      es: 'Fase 2: Pipeline de Datos y Linaje (Data Lineage)'
    },
    initialStatus: 'WARNING',
    finalStatus: 'PRODUCTION_READY',
    summary: {
      'pt-BR': 'Rastreabilidade ponta a ponta desde o dataset bruto até o modelo em produção, com correção da inconsistência de configuração.',
      en: 'End-to-end lineage tracking from raw dataset to production artifact, with complete config-backbone consistency resolution.',
      es: 'Trazabilidad de extremo a extremo desde el dataset hasta el artefacto en producción, con resolución de inconsistencia de configuración.'
    },
    keyFixes: [
      {
        title: {
          'pt-BR': 'Correção da Inconsistência (model.name vs backbone)',
          en: 'Resolution of Config Inconsistency (model.name vs backbone)',
          es: 'Resolución de Inconsistencia (model.name vs backbone)'
        },
        description: {
          'pt-BR': 'Eliminada a ambiguidade "model.name=resnet50 vs backbone=efficientnet_b0". O schema agora valida model.architecture="resnet50_64ch" e garante que o artefato gerado corresponde exatamente ao grafo instanciado.',
          en: 'Resolved ambiguity where config stated resnet50 while backbone loaded efficientnet. Config schema now strictly validates model.architecture and matches loaded weights.',
          es: 'Eliminada la ambigüedad donde la config decía resnet50 y cargaba efficientnet. El esquema valida estrictamente model.architecture.'
        },
        status: 'RESOLVED',
        codeSnippet: `class ModelConfig(BaseModel):
    architecture: Literal["resnet50_64ch", "vit_b16_64ch", "hybrid_cnn_vit"]
    pretrained_backbone: str = Field(..., description="Deve coincidir estritamente com o checkpoint")
    num_input_bands: int = 64
    embedding_adapter_active: bool = True
    
    @model_validator(mode="after")
    def verify_backbone_compatibility(self):
        if "resnet" in self.architecture and "resnet" not in self.pretrained_backbone:
            raise ValueError(f"Inconsistência detectada: {self.architecture} não suporta {self.pretrained_backbone}")
        return self`
      },
      {
        title: {
          'pt-BR': 'Data Lineage & Reprodutibilidade Determinística',
          en: 'Deterministic Data Lineage & Reproducibility',
          es: 'Data Lineage Determinista y Reproducibilidad'
        },
        description: {
          'pt-BR': 'Bloqueio de semente randômica (seed=42, torch.backends.cudnn.deterministic=True) e amarração de hash SHA-256 para dataset, pré-processamento e tensores.',
          en: 'Enforced deterministic CUDA operations and SHA-256 hash pinning for dataset versions, augmentations, and extracted feature embeddings.',
          es: 'Operaciones CUDA deterministas y hash SHA-256 para versiones de dataset, aumentación y embeddings.'
        },
        status: 'VERIFIED'
      }
    ]
  },
  {
    id: 'phase3',
    number: 3,
    title: {
      'pt-BR': 'Fase 3: Governança de Modelos & Registry Gate',
      en: 'Phase 3: Model Governance & Promotion Gates',
      es: 'Fase 3: Gobernanza de Modelos y Puertas de Promoción'
    },
    initialStatus: 'WARNING',
    finalStatus: 'PRODUCTION_READY',
    summary: {
      'pt-BR': 'Cadeia de aprovação e promoção automatizada com gates de validação, checksum SHA-256, rollback instantâneo e estratégia Champion/Challenger.',
      en: 'Automated model promotion pipeline with validation gates, SHA-256 checksum verification, instant rollback, and Champion/Challenger deployment.',
      es: 'Pipeline automatizado de promoción con puertas de validación, checksum SHA-256, rollback instantáneo y Champion/Challenger.'
    },
    keyFixes: [
      {
        title: {
          'pt-BR': 'Pipeline de Promoção por Estágios (Gate de Validação)',
          en: 'Staged Promotion Pipeline (Automated Validation Gate)',
          es: 'Pipeline de Promoción por Etapas (Puerta de Validación)'
        },
        description: {
          'pt-BR': 'Transição estrita: Experiment → Evaluation → Candidate → Validation Gate (F1 >= 0.985 & Latência < 50ms) → Registered Model → Approved → Production.',
          en: 'Strict stage progression: Experiment → Evaluation → Candidate → Validation Gate (F1 >= 0.985 & Latency < 50ms) → Registered → Production.',
          es: 'Progresión estricta: Experiment → Evaluation → Candidate → Validation Gate → Registered → Production.'
        },
        status: 'VERIFIED',
        codeSnippet: `async def evaluate_and_promote_model(candidate_id: str) -> PromotionResult:
    metrics = await run_golden_benchmark(candidate_id)
    if metrics.macro_f1 < 0.985 or metrics.p95_latency_ms > 50.0:
        return PromotionResult(promoted=False, reason="Validation Gate Fail: F1 ou Latência fora do SLA")
    
    # Checksum verification
    if not verify_artifact_sha256(candidate_id):
        raise ArtifactCorruptionError("Hash SHA-256 incompatível")
        
    return await promote_to_production_champion(candidate_id)`
      },
      {
        title: {
          'pt-BR': 'Estratégia Champion / Challenger & Rollback em 1 Clique',
          en: 'Champion / Challenger Strategy & 1-Click Rollback',
          es: 'Estrategia Champion / Challenger y Rollback en 1 Clic'
        },
        description: {
          'pt-BR': 'Roteamento de 90% do tráfego para o Champion (v2.4.0) e 10% para o Challenger (v2.5.0-rc1) com monitoramento contínuo de drift e rollback automático.',
          en: '90/10 traffic split between Champion and Challenger with continuous PSI monitoring and zero-downtime rollback.',
          es: 'División de tráfico 90/10 entre Champion y Challenger con monitoreo PSI y rollback sin tiempo de inactividad.'
        },
        status: 'RESOLVED'
      }
    ]
  },
  {
    id: 'phase4',
    number: 4,
    title: {
      'pt-BR': 'Fase 4: API Enterprise & Hardening de Inferência',
      en: 'Phase 4: Enterprise API & Inference Hardening',
      es: 'Fase 4: API Enterprise y Hardening de Inferencia'
    },
    initialStatus: 'WARNING',
    finalStatus: 'PRODUCTION_READY',
    summary: {
      'pt-BR': 'Substituição de PIL por Rasterio nativo (GeoTIFF multi-banda), strict=True no carregamento de pesos, X-Request-ID, limites de upload e autenticação Bearer.',
      en: 'Native multi-band Rasterio/GDAL ingestion, strict=True model state loading with checksum validation, X-Request-ID tracing, and upload guards.',
      es: 'Ingestión Rasterio/GDAL nativa multi-banda, strict=True en carga de pesos, X-Request-ID, límites de subida y autenticación Bearer.'
    },
    keyFixes: [
      {
        title: {
          'pt-BR': 'Carga Estrita de Pesos (model.load_state_dict strict=True)',
          en: 'Strict Weight Loading (model.load_state_dict strict=True)',
          es: 'Carga Estricta de Pesos (strict=True con Fail Fast)'
        },
        description: {
          'pt-BR': 'Eliminado o perigoso "strict=False". O sistema valida o hash do artefato e exige correspondência exata de tensores, disparando Fail Fast em caso de inconsistência.',
          en: 'Replaced dangerous strict=False with strict=True preceded by SHA-256 checksum and shape validation, ensuring immediate fail-fast on mismatch.',
          es: 'Eliminado strict=False. El sistema valida el hash del artefacto y exige coincidencia exacta con Fail Fast.'
        },
        status: 'RESOLVED',
        codeSnippet: `# Em vez de model.load_state_dict(state, strict=False) [INSEGURO]
# Padrão Enterprise Triminds:
artifact_meta = verify_and_get_metadata(checkpoint_path)
if artifact_meta.sha256 != EXPECTED_MODEL_CHECKSUM:
    raise SecurityChecksumMismatchError("Checksum do modelo corrompido ou adulterado")

model.load_state_dict(torch.load(checkpoint_path, map_location=device), strict=True)
logger.info("Modelo carregado com strict=True e verificação de integridade 100% aprovada.")`
      },
      {
        title: {
          'pt-BR': 'Pipeline GeoTIFF Real sem Conversão Lossy para RGB',
          en: 'Real GeoTIFF Pipeline without Lossy RGB Degradation',
          es: 'Pipeline GeoTIFF Real sin Degradación Lossy a RGB'
        },
        description: {
          'pt-BR': 'Leitura via Rasterio de arrays float32 de até 64 bandas espectrais, preservando faixas NIR, RedEdge e SWIR cruciais para classificação agronômica e florestal.',
          en: 'Direct Rasterio float32 parsing of up to 64 spectral bands, preserving raw NIR, RedEdge, and SWIR channels.',
          es: 'Lectura con Rasterio de arrays float32 de hasta 64 bandas espectrales, preservando canales NIR, RedEdge y SWIR.'
        },
        status: 'RESOLVED',
        codeSnippet: `import rasterio

async def parse_geotiff_tensor(file_bytes: bytes) -> torch.Tensor:
    with rasterio.MemoryFile(file_bytes) as memfile:
        with memfile.open() as src:
            if src.count not in [3, 10, 12, 64]:
                raise InvalidBandCountError(f"Contagem de bandas ({src.count}) não suportada")
            tensor_data = src.read() # Shape: (C, H, W)
            return torch.from_numpy(tensor_data.astype(np.float32))`
      },
      {
        title: {
          'pt-BR': 'Segurança, Limites de Upload & Observabilidade (X-Request-ID)',
          en: 'Security, Upload Limits & Tracing (X-Request-ID)',
          es: 'Seguridad, Límites de Subida y Trazabilidad (X-Request-ID)'
        },
        description: {
          'pt-BR': 'Headers de rastreabilidade distribuída, autenticação por API Key / Bearer OAuth2, limite de tamanho de 50MB, validação de MIME type e métricas Prometheus.',
          en: 'Distributed tracing with X-Request-ID, Bearer token auth, 50MB file size limit, MIME enforcement, and Prometheus metrics exporting.',
          es: 'Trazabilidad con X-Request-ID, autenticación Bearer, límite de 50MB, validación MIME y métricas Prometheus.'
        },
        status: 'VERIFIED'
      }
    ]
  },
  {
    id: 'phase5',
    number: 5,
    title: {
      'pt-BR': 'Fase 5: Arquitetura Cloud GCP & Infraestrutura como Código (Terraform)',
      en: 'Phase 5: GCP Cloud Architecture & Infrastructure as Code (Terraform)',
      es: 'Fase 5: Arquitectura Cloud GCP e Infraestructura como Código (Terraform)'
    },
    initialStatus: 'PASS',
    finalStatus: 'PRODUCTION_READY',
    summary: {
      'pt-BR': 'Integração completa com GCP: GCS, Vertex AI Model Registry/Endpoints, Google Earth Engine, Dataproc Serverless, BigQuery Feature Store e módulos Terraform declarativos.',
      en: 'End-to-end GCP integration: GCS data lake, Vertex AI Registry & Endpoints, Earth Engine API, Dataproc PySpark batch, BigQuery, and declarative Terraform IaC.',
      es: 'Integración completa con GCP: GCS, Vertex AI, Earth Engine, Dataproc, BigQuery y módulos Terraform.'
    },
    keyFixes: [
      {
        title: {
          'pt-BR': 'Vertex AI Private Endpoints & Autoscaling GPU',
          en: 'Vertex AI Private Endpoints & GPU Autoscaling',
          es: 'Vertex AI Private Endpoints y Autoscaling GPU'
        },
        description: {
          'pt-BR': 'Deploy automatizado em instâncias n1-standard-8 equipadas com NVIDIA A100/T4, scale-to-zero para economia e tempo de resposta < 40ms.',
          en: 'Automated deployment on n1-standard-8 instances with NVIDIA A100/T4 GPUs, scale-to-zero capability, and <40ms p95 latency.',
          es: 'Despliegue automatizado en n1-standard-8 con NVIDIA A100/T4, scale-to-zero y latencia <40ms.'
        },
        status: 'VERIFIED',
        codeSnippet: `resource "google_vertex_ai_endpoint" "geoai_endpoint" {
  name         = "triminds-geoai-production"
  location     = "us-central1"
  network      = google_compute_network.vpc.id
  description  = "Endpoint de inferência em produção para modelos LULC 64 bandas"
}`
      },
      {
        title: {
          'pt-BR': 'Pipeline Google Earth Engine + Dataproc PySpark',
          en: 'Google Earth Engine + Dataproc PySpark Pipeline',
          es: 'Pipeline Google Earth Engine + Dataproc PySpark'
        },
        description: {
          'pt-BR': 'Ingestão massiva de mosaicos anuais Sentinel-2 e Google Satellite Embeddings v1 com extração distribuída de tensores e persistência em BigQuery/GCS.',
          en: 'Massive batch extraction of Sentinel-2 and Google Satellite Embeddings v1 mosaics with distributed PySpark workers writing to BigQuery & GCS.',
          es: 'Extracción masiva de mosaicos Sentinel-2 y Google Satellite Embeddings v1 con PySpark hacia BigQuery y GCS.'
        },
        status: 'VERIFIED'
      }
    ]
  }
];

export const DATA_LINEAGE_CHAIN: DataLineageNode[] = [
  {
    id: 'node-dataset',
    stage: 'dataset',
    name: 'EuroSAT + Google Earth Engine Embeddings (64 Bands)',
    version: 'v2.4.1',
    hash: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    timestamp: '2024-10-14 09:12:00 UTC',
    metadata: {
      totalTiles: 27000,
      spatialResolution: '10m / pixel',
      channels: 64,
      biomesCovered: 'Cerrado, Amazônia, Mata Atlântica, Pampas'
    },
    status: 'verified'
  },
  {
    id: 'node-prep',
    stage: 'preprocessing',
    name: 'Multispectral Normalization & Cloud Masking Pipeline',
    version: 'v1.4.0',
    hash: 'sha256:4d70b329ef31d044da8722c608f0a09e06e30060959f635b71cbb6b2e1bf88f6',
    timestamp: '2024-10-14 11:30:15 UTC',
    metadata: {
      cloudThreshold: '0.05',
      augmentationSeed: 42,
      deterministicCuda: 'TRUE',
      clippingRange: '[-3.0, 3.0] Z-Score'
    },
    status: 'verified'
  },
  {
    id: 'node-feature',
    stage: 'feature_extractor',
    name: 'EmbeddingAdapter 64-Band Layer Extractor',
    version: 'v2.0.0',
    hash: 'sha256:9b12850989f668705669b76c8c4e4604d5386d34e2ab39866878b273b4d4cf77',
    timestamp: '2024-10-14 14:05:40 UTC',
    metadata: {
      inputChannels: 64,
      outputDim: 64,
      spectralPreservation: '100% (No RGB compression)',
      kernelSize: '1x1 Conv + BatchNorm'
    },
    status: 'verified'
  },
  {
    id: 'node-run',
    stage: 'training_run',
    name: 'Hybrid CNN-Transformer Training (Run #TR-9482)',
    version: 'Run-9482',
    hash: 'mlflow:run_id_38fe9921abcf4711812a02b6678',
    timestamp: '2024-10-15 02:44:19 UTC',
    metadata: {
      epochs: 50,
      batchSize: 64,
      learningRate: 0.0001,
      optimizer: 'AdamW (weight_decay=1e-4)',
      hardware: '4x NVIDIA A100-SXM4-40GB'
    },
    status: 'verified'
  },
  {
    id: 'node-artifact',
    stage: 'artifact',
    name: 'hybrid_cnn_vit_64ch_prod_v2.4.pt',
    version: 'v2.4.0',
    hash: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    timestamp: '2024-10-15 06:18:22 UTC',
    metadata: {
      fileSizeBytes: '179.2 MB',
      strictLoadingCompatible: 'TRUE',
      gcsUri: 'gs://triminds-models-prod/weights/v2.4.0/hybrid_cnn_vit.pt',
      backboneConfigMatch: 'VERIFIED (hybrid_cnn_vit)'
    },
    status: 'verified'
  },
  {
    id: 'node-eval',
    stage: 'evaluation',
    name: 'Validation Gate & Benchmark Certification',
    version: 'Certified-Production',
    hash: 'gate:approved_by_mlops_lead_20241015',
    timestamp: '2024-10-15 08:00:00 UTC',
    metadata: {
      macroF1Score: 0.992,
      overallAccuracy: 0.994,
      p95LatencyMs: 48.0,
      zeroDeforestationFalsePositive: '< 0.1%'
    },
    status: 'verified'
  }
];

export const GOVERNANCE_GATES: GovernanceGate[] = [
  {
    id: 'gate-1',
    stepName: '1. Verificação de Integridade de Configuração (No Mismatch)',
    status: 'passed',
    rule: 'model.architecture == pretrained_backbone == artifact_weights',
    metricTarget: '100% Match',
    actualMetric: '100% Match (hybrid_cnn_vit)',
    signOffBy: 'ConfigValidator-CI'
  },
  {
    id: 'gate-2',
    stepName: '2. SLA de Performance & Generalização (Macro F1)',
    status: 'passed',
    rule: 'Macro F1 >= 0.985 em Holdout Set de 5.400 tiles',
    metricTarget: '>= 0.985',
    actualMetric: '0.992 (Aprovado)',
    signOffBy: 'VertexAI-Model-Evaluation'
  },
  {
    id: 'gate-3',
    stepName: '3. Latência de Inferência P95 em GPU',
    status: 'passed',
    rule: 'Latência P95 < 50.0ms com lote de tensores 64-bandas',
    metricTarget: '< 50ms',
    actualMetric: '48.2ms (Aprovado)',
    signOffBy: 'PerformanceBenchmark-Suite'
  },
  {
    id: 'gate-4',
    stepName: '4. Verificação de Checksum SHA-256 & strict=True Loading',
    status: 'passed',
    rule: 'SHA-256 match exato do artefato registrado no GCS & strict loading',
    metricTarget: 'Zero Mismatch',
    actualMetric: 'SHA-256 Verified (Strict=True)',
    signOffBy: 'SecurityAudit-Agent'
  },
  {
    id: 'gate-5',
    stepName: '5. Aprovação de Promoção para Produção (Champion Active)',
    status: 'active',
    rule: 'Aprovação por Líder MLOps & Roteamento de 90% do tráfego',
    metricTarget: 'Status == Champion',
    actualMetric: 'Champion Active (v2.4.0)',
    signOffBy: 'MLOps Lead'
  }
];
