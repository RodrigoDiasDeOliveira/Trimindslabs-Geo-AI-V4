import { MapSourceDefinition, SavedAreaAnalysis } from '../types';

export const MAP_SOURCES: MapSourceDefinition[] = [
  {
    id: 'google_earth_engine',
    name: 'Google Earth Engine: Sentinel-2 L2A MSI Harmonized',
    provider: 'Google Earth Engine / Copernicus',
    resolution: '10m / pixel',
    bandCount: 12,
    description: 'Série multiespectral com correção atmosférica BOA, mascaramento de nuvens QA60 e 12 bandas (RGB, RedEdge, NIR e SWIR).',
    cloudCoverageThresholdPct: 5,
    badgeColor: 'emerald',
    availableFormats: [
      {
        format: 'cog_float32',
        label: 'GeoTIFF Otimizado para Nuvem (COG Float32)',
        description: 'Tensor matricial normalizado de reflectância de superfície (12 canais, EPSG:4326).',
        recommended: true,
      },
      {
        format: 'gee_asset_image',
        label: 'Asset Google Earth Engine (ee.Image)',
        description: 'Coleção filtrada COPERNICUS/S2_SR_HARMONIZED processada via Cloud Function.',
        recommended: false,
      },
      {
        format: 'geojson_wgs84',
        label: 'GeoJSON Bounding Box (Vetor WGS84)',
        description: 'Polígono delimitador para ingestão assíncrona no backend GeoAI.',
        recommended: false,
      },
    ],
  },
  {
    id: 'google_satellite_embedding',
    name: 'Google Satellite Embedding V1 (64 Canais Latentes)',
    provider: 'Google Research / Satellite Foundation Models',
    resolution: '10m / pixel',
    bandCount: 64,
    description: 'Embeddings auto-supervisionados de 64 dimensões latentes para classificação de alta precisão de biomassa e cobertura do solo.',
    cloudCoverageThresholdPct: 2,
    badgeColor: 'purple',
    availableFormats: [
      {
        format: 'zarr_64channel_array',
        label: 'Tensor Zarr / NumPy Array (1, 64, H, W)',
        description: 'Representação multidimensional compactada ideal para transformers e CNNs.',
        recommended: true,
      },
      {
        format: 'cog_float32',
        label: 'GeoTIFF Multicanal 64 Bandas',
        description: 'Arquivo raster com metadados geoespaciais e 64 camadas float32.',
        recommended: false,
      },
    ],
  },
  {
    id: 'google_maps_satellite',
    name: 'Google Maps Platform: Satellite High-Res Basemap',
    provider: 'Google Maps Platform',
    resolution: 'Sub-métrica (< 0.5m a 2.5m)',
    bandCount: 4,
    description: 'Camada de mosaico de satélite de alta fidelidade visual da Google Maps Platform para inspeção de limites e estradas.',
    cloudCoverageThresholdPct: 0,
    badgeColor: 'sky',
    availableFormats: [
      {
        format: 'cog_float32',
        label: 'GeoTIFF Ortorretificado (RGB + NIR Sintético)',
        description: 'Mosaico radiométrico com alta definição espacial para detalhamento de lavoura.',
        recommended: true,
      },
      {
        format: 'geojson_wgs84',
        label: 'Coordenadas Poligonais WGS84 EPSG:4326',
        description: 'Geometria do talhão vinculada ao tile server da Google Maps Platform.',
        recommended: false,
      },
    ],
  },
  {
    id: 'landsat9_oli2',
    name: 'Landsat 9 OLI-2 (Surface Reflectance)',
    provider: 'USGS / NASA / Google Earth Engine',
    resolution: '30m / pixel',
    bandCount: 8,
    description: 'Calibração radiométrica de longo prazo com bandas termais e ópticas para validação histórica de uso do solo.',
    cloudCoverageThresholdPct: 8,
    badgeColor: 'amber',
    availableFormats: [
      {
        format: 'cog_float32',
        label: 'GeoTIFF Surface Reflectance (B2-B7)',
        description: 'Reflectância calibrada com bandas B2 a B7 empilhadas.',
        recommended: true,
      },
    ],
  },
  {
    id: 'planetscope_superdove',
    name: 'PlanetScope SuperDove (NICFI High-Res 8-Band)',
    provider: 'Planet Labs / Google Cloud Public Datasets',
    resolution: '3m / pixel',
    bandCount: 8,
    description: 'Constelação de alta frequência de revisita diária para monitoramento de desmatamento cirúrgico e fenologia.',
    cloudCoverageThresholdPct: 5,
    badgeColor: 'teal',
    availableFormats: [
      {
        format: 'cog_float32',
        label: 'GeoTIFF Planet PSScene Ortorretificado',
        description: '8 bandas espectrais (Costal Blue, Blue, Green II, Yellow, Red, RedEdge, NIR).',
        recommended: true,
      },
    ],
  },
];

export interface PresetRegion {
  id: string;
  name: string;
  farm: string;
  state: string;
  biome: string;
  center: { lat: number; lng: number };
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  defaultHectares: number;
  previewUrl: string;
  description: string;
}

export const PRESET_REGIONS: PresetRegion[] = [
  {
    id: 'reg_sorriso_mt',
    name: 'Sorriso (Mato Grosso)',
    farm: 'Fazenda Terra Produtiva',
    state: 'MT',
    biome: 'Cerrado',
    center: { lat: -12.515, lng: -55.69 },
    bbox: [-55.72, -12.54, -55.66, -12.49],
    defaultHectares: 5420,
    previewUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
    description: 'Epicentro da produção brasileira de soja e milho safrinha com pivôs centrais e talhões contíguos.',
  },
  {
    id: 'reg_santarem_pa',
    name: 'Santarém (Pará)',
    farm: 'Gleba Rio Tapajós',
    state: 'PA',
    biome: 'Amazônia',
    center: { lat: -2.45, lng: -54.70 },
    bbox: [-54.73, -2.48, -54.67, -2.42],
    defaultHectares: 3890,
    previewUrl: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1200&q=80',
    description: 'Fronteira florestal com mosaico de floresta primária ombrófila densa e lavouras consolidadas.',
  },
  {
    id: 'reg_lem_ba',
    name: 'Luís Eduardo Magalhães (Bahia)',
    farm: 'Agropecuária Oeste Baiano',
    state: 'BA',
    biome: 'Matopiba / Cerrado',
    center: { lat: -12.09, lng: -45.795 },
    bbox: [-45.83, -12.12, -45.76, -12.06],
    defaultHectares: 6850,
    previewUrl: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1200&q=80',
    description: 'Chapadões planos do Matopiba ideais para algodão e grãos sob solo arenoso profundo.',
  },
  {
    id: 'reg_corumba_ms',
    name: 'Corumbá (Mato Grosso do Sul)',
    farm: 'Fazenda Retiro Pantaneiro',
    state: 'MS',
    biome: 'Pantanal',
    center: { lat: -19.01, lng: -57.645 },
    bbox: [-57.68, -19.04, -57.61, -18.98],
    defaultHectares: 4200,
    previewUrl: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=1200&q=80',
    description: 'Área alagável com pastagens nativas, meandros de rios e cordilheiras de mata residual.',
  },
  {
    id: 'reg_londrina_pr',
    name: 'Londrina (Paraná)',
    farm: 'Estância Terra Roxa',
    state: 'PR',
    biome: 'Mata Atlântica',
    center: { lat: -23.31, lng: -51.175 },
    bbox: [-51.21, -23.34, -51.14, -23.28],
    defaultHectares: 2650,
    previewUrl: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=1200&q=80',
    description: 'Solo de terra roxa altamente fértil com rotação de culturas (trigo, soja) e matas ciliares protegidas.',
  },
  {
    id: 'reg_balsas_ma',
    name: 'Balsas (Maranhão)',
    farm: 'Fazenda Serra da Lajes',
    state: 'MA',
    biome: 'Cerrado Maranhense',
    center: { lat: -7.52, lng: -46.025 },
    bbox: [-46.06, -7.55, -45.99, -7.49],
    defaultHectares: 4980,
    previewUrl: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=80',
    description: 'Região de expansão agrícola acelerada com monitoramento rigoroso de Reserva Legal.',
  },
];

export const INITIAL_SAVED_ANALYSES: SavedAreaAnalysis[] = [
  {
    id: 'analysis_sorriso_001',
    title: 'Auditoria Safra 2024 - Talhão Principal Sorriso',
    farmName: 'Fazenda Terra Produtiva',
    region: 'Sorriso, MT',
    biome: 'Cerrado',
    sourceType: 'google_earth_engine',
    sourceFormat: 'cog_float32',
    center: { lat: -12.515, lng: -55.69 },
    bbox: [-55.72, -12.54, -55.66, -12.49],
    areaHectares: 5420,
    selectedModel: 'hybrid_cnn_vit',
    notes: 'Talhão analisado antes do plantio da safrinha. Ausência de desmatamento recente. Reserva Legal de 22% conforme legislação do Cerrado.',
    createdAt: '2026-09-10T14:30:00Z',
    updatedAt: '2026-09-12T09:15:00Z',
    author: 'Rodrigo Dias de Oliveira',
    authorRole: 'admin',
    status: 'analyzed',
    results: {
      meanNdvi: 0.78,
      meanNdre: 0.64,
      carbonStockTon: 14250,
      carStatus: 'CONFORME',
      macroF1: 0.992,
      classBreakdown: [
        { classId: 'soja_milho', className: 'Lavoura Anual (Soja/Milho)', hectares: 3252, percentage: 60.0, color: '#f59e0b' },
        { classId: 'floresta_nativa', className: 'Floresta Nativa', hectares: 1192, percentage: 22.0, color: '#10b981' },
        { classId: 'pastagem', className: 'Pastagem Produtiva', hectares: 542, percentage: 10.0, color: '#84cc16' },
        { classId: 'corpo_dagua', className: 'Recursos Hídricos / Represas', hectares: 271, percentage: 5.0, color: '#06b6d4' },
        { classId: 'cerrado_savana', className: 'Vegetação Herbácea / Savana', hectares: 163, percentage: 3.0, color: '#eab308' },
      ],
    },
  },
  {
    id: 'analysis_santarem_002',
    title: 'Monitoramento Preservação Florestal Tapajós',
    farmName: 'Gleba Rio Tapajós',
    region: 'Santarém, PA',
    biome: 'Amazônia',
    sourceType: 'google_satellite_embedding',
    sourceFormat: 'zarr_64channel_array',
    center: { lat: -2.45, lng: -54.70 },
    bbox: [-54.73, -2.48, -54.67, -2.42],
    areaHectares: 3890,
    selectedModel: 'resnet50',
    notes: 'Auditoria de conformidade para o bioma Amazônia (exigência de 80% de Reserva Legal). Floresta intacta e densa sem indício de queimadas.',
    createdAt: '2026-09-11T16:20:00Z',
    updatedAt: '2026-09-11T16:20:00Z',
    author: 'Operador de Imagens',
    authorRole: 'operador',
    status: 'analyzed',
    results: {
      meanNdvi: 0.86,
      meanNdre: 0.72,
      carbonStockTon: 48900,
      carStatus: 'CONFORME',
      macroF1: 0.988,
      classBreakdown: [
        { classId: 'floresta_nativa', className: 'Floresta Nativa Ombrófila', hectares: 3190, percentage: 82.0, color: '#10b981' },
        { classId: 'corpo_dagua', className: 'Rios e Igarapés', hectares: 350, percentage: 9.0, color: '#06b6d4' },
        { classId: 'soja_milho', className: 'Lavoura Consolidada', hectares: 233, percentage: 6.0, color: '#f59e0b' },
        { classId: 'pastagem', className: 'Pastagem Regenerativa', hectares: 117, percentage: 3.0, color: '#84cc16' },
      ],
    },
  },
];
