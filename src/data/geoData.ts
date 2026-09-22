import { Language } from '../types';

export interface GeoSample {
  id: string;
  name: Record<Language, string>;
  region: string;
  biome: Record<Language, string>;
  coordinates: {
    lat: number;
    lng: number;
    bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  };
  sensor: 'GoogleSatelliteEmbedding' | 'Sentinel2_L2A' | 'Landsat8_9';
  channels: number;
  previewUrl: string;
  defaultClassId: string;
  simulatedBands: {
    rgb: [number, number, number]; // RGB mean reflectance 0-1
    nir: number;
    redEdge: number;
    swir: number;
    ndvi: number;
    ndre: number;
    embeddingVectorSample: number[]; // 64-band sample slice
  };
  timeSeriesHistory: {
    year: number;
    primaryClass: string;
    forestCoverPct: number;
    cropCoverPct: number;
    pastureCoverPct: number;
    waterCoverPct: number;
    ndviMean: number;
  }[];
}

export interface LulcClass {
  id: string;
  code: string;
  name: Record<Language, string>;
  description: Record<Language, string>;
  color: string;
  badgeBg: string;
  badgeBorder: string;
}

export interface DeepLearningModel {
  id: string;
  name: string;
  family: 'CNN' | 'Transformer' | 'Hybrid';
  parameters: string;
  supports64Bands: boolean;
  adapterRequired: boolean;
  adapterInfo: Record<Language, string>;
  inferenceLatencyMs: number;
  f1Score: number;
  accuracy: number;
  topClassScores: Record<string, number>;
  description: Record<Language, string>;
}

export interface DriftBandMetric {
  bandIndex: number;
  bandName: string;
  wavelengthNm?: string;
  baselineMean: number;
  currentMean: number;
  baselineStd: number;
  currentStd: number;
  psi: number; // Population Stability Index
  ksStatistic: number; // Kolmogorov-Smirnov
  pValue: number;
  driftStatus: 'STABLE' | 'WARNING' | 'CRITICAL';
}

export const LULC_CLASSES: LulcClass[] = [
  {
    id: 'AnnualCrop',
    code: 'AC',
    name: {
      'pt-BR': 'Lavoura Anual (Soja / Milho)',
      en: 'Annual Crop (Soybean / Corn)',
      es: 'Cultivo Anual (Soja / Maíz)'
    },
    description: {
      'pt-BR': 'Áreas de agricultura intensiva com ciclos vegetativos curtos e variação sazonal de biomassa.',
      en: 'Intensive agriculture lands with short seasonal vegetation cycles and high biomass dynamics.',
      es: 'Tierras agrícolas intensivas con ciclos vegetativos estacionales y dinámica de biomasa.'
    },
    color: '#eab308',
    badgeBg: 'bg-yellow-500/10 text-yellow-400',
    badgeBorder: 'border-yellow-500/30'
  },
  {
    id: 'Forest',
    code: 'FO',
    name: {
      'pt-BR': 'Floresta Nativa / Dossel Denso',
      en: 'Native Forest / Dense Canopy',
      es: 'Bosque Nativo / Dosel Denso'
    },
    description: {
      'pt-BR': 'Formações florestais contínuas, alta absorção na faixa vermelha e alta refletância no infravermelho próximo (NIR).',
      en: 'Continuous forest stands, strong red absorption and pronounced near-infrared (NIR) plateau.',
      es: 'Formaciones forestales continuas, fuerte absorción roja y meseta infrarroja cercana (NIR).'
    },
    color: '#15803d',
    badgeBg: 'bg-emerald-500/10 text-emerald-400',
    badgeBorder: 'border-emerald-500/30'
  },
  {
    id: 'HerbaceousVegetation',
    code: 'HV',
    name: {
      'pt-BR': 'Vegetação Herbácea / Campo',
      en: 'Herbaceous Vegetation / Grassland',
      es: 'Vegetación Herbácea / Pastizal'
    },
    description: {
      'pt-BR': 'Campos naturais e vegetação rasteira com moderada assinatura de clorofila.',
      en: 'Natural grasslands and shrublands displaying moderate chlorophyll spectral reflectance.',
      es: 'Pastizales naturales y matorrales con reflectancia moderada de clorofila.'
    },
    color: '#84cc16',
    badgeBg: 'bg-lime-500/10 text-lime-400',
    badgeBorder: 'border-lime-500/30'
  },
  {
    id: 'Highway',
    code: 'HW',
    name: {
      'pt-BR': 'Rodovias & Infraestrutura Viária',
      en: 'Highway & Road Infrastructure',
      es: 'Carreteras e Infraestructura Vial'
    },
    description: {
      'pt-BR': 'Estruturas lineares pavimentadas com assinatura espectral de asfalto/concreto e baixa umidade.',
      en: 'Linear paved surfaces with distinct asphalt/concrete spectral signatures and low moisture.',
      es: 'Superficies lineales pavimentadas con firmas de asfalto/hormigón y baja humedad.'
    },
    color: '#64748b',
    badgeBg: 'bg-slate-500/10 text-slate-300',
    badgeBorder: 'border-slate-500/30'
  },
  {
    id: 'Industrial',
    code: 'IN',
    name: {
      'pt-BR': 'Área Industrial & Logística',
      en: 'Industrial & Logistic Complexes',
      es: 'Área Industrial y Logística'
    },
    description: {
      'pt-BR': 'Galpões, pátios de concreto, estruturas metálicas e alta refletância térmica.',
      en: 'Large warehouses, concrete impervious areas, metal roofs, and thermal reflectance.',
      es: 'Grandes almacenes, áreas impermeables de hormigón y alta reflectancia térmica.'
    },
    color: '#dc2626',
    badgeBg: 'bg-red-500/10 text-red-400',
    badgeBorder: 'border-red-500/30'
  },
  {
    id: 'Pasture',
    code: 'PA',
    name: {
      'pt-BR': 'Pastagem Manejada',
      en: 'Managed Pastureland',
      es: 'Pasturas Manejadas'
    },
    description: {
      'pt-BR': 'Áreas gramíneas dedicadas à pecuária com moderado pastejo e solo exposto intermitente.',
      en: 'Grazing grasslands for livestock with moderate NDVI and intermittent bare soil signal.',
      es: 'Pastizales de pastoreo con NDVI moderado y señal intermitente de suelo expuesto.'
    },
    color: '#a3e635',
    badgeBg: 'bg-lime-400/10 text-lime-300',
    badgeBorder: 'border-lime-400/30'
  },
  {
    id: 'PermanentCrop',
    code: 'PC',
    name: {
      'pt-BR': 'Lavoura Permanente (Café / Fruticultura)',
      en: 'Permanent Crop (Coffee / Citrus)',
      es: 'Cultivo Permanente (Café / Frutales)'
    },
    description: {
      'pt-BR': 'Cultivos de ciclo longo perenes organizados em linhas estruturadas de plantio.',
      en: 'Long-cycle perennial woody crops organized in regular spatial row geometries.',
      es: 'Cultivos perennes leñosos de ciclo largo organizados en hileras regulares.'
    },
    color: '#d97706',
    badgeBg: 'bg-amber-500/10 text-amber-400',
    badgeBorder: 'border-amber-500/30'
  },
  {
    id: 'Residential',
    code: 'RE',
    name: {
      'pt-BR': 'Área Urbana Residencial',
      en: 'Residential Urban Zone',
      es: 'Zona Urbana Residencial'
    },
    description: {
      'pt-BR': 'Edificações densas, telhados cerâmicos, calçadas e malha urbana consolidada.',
      en: 'Dense residential dwellings, ceramic roofs, pavements, and urban fabric.',
      es: 'Viviendas residenciales densas, techos cerámicos y tejido urbano consolidado.'
    },
    color: '#ec4899',
    badgeBg: 'bg-pink-500/10 text-pink-400',
    badgeBorder: 'border-pink-500/30'
  },
  {
    id: 'River',
    code: 'RI',
    name: {
      'pt-BR': 'Corpos Hídricos Fluviais (Rios)',
      en: 'Fluvial Water Bodies (Rivers)',
      es: 'Cuerpos de Agua Fluviales (Ríos)'
    },
    description: {
      'pt-BR': 'Cursos de água superficiais com forte absorção espectral em NIR e SWIR.',
      en: 'Surface water courses displaying near-total absorption in NIR and SWIR bands.',
      es: 'Cursos de agua superficiales con fuerte absorción en las bandas NIR y SWIR.'
    },
    color: '#0284c7',
    badgeBg: 'bg-sky-500/10 text-sky-400',
    badgeBorder: 'border-sky-500/30'
  },
  {
    id: 'SeaLake',
    code: 'SL',
    name: {
      'pt-BR': 'Mares, Lagos & Reservatórios',
      en: 'Sea, Lakes & Reservoirs',
      es: 'Mares, Lagos y Embalses'
    },
    description: {
      'pt-BR': 'Grandes reservatórios, lagoas e águas abertas com baixo índice de turbidez.',
      en: 'Deep water reservoirs, coastal sea water, and lakes with distinct blue-green reflectance.',
      es: 'Grandes embalses de agua, aguas costeras y lagos con reflectancia azul-verde.'
    },
    color: '#06b6d4',
    badgeBg: 'bg-cyan-500/10 text-cyan-400',
    badgeBorder: 'border-cyan-500/30'
  }
];

export const GEO_SAMPLES: GeoSample[] = [
  {
    id: 'sample-mt-soy',
    name: {
      'pt-BR': 'Mato Grosso - Sorriso (Pivô & Lavoura Soja)',
      en: 'Mato Grosso - Sorriso (Soybean Intensive Crop)',
      es: 'Mato Grosso - Sorriso (Cultivo Intensivo de Soja)'
    },
    region: 'Sorriso, MT - Brasil',
    biome: {
      'pt-BR': 'Cerrado / Transição Amazônica',
      en: 'Cerrado / Amazon Transition',
      es: 'Cerrado / Transición Amazónica'
    },
    coordinates: {
      lat: -12.5428,
      lng: -55.7214,
      bbox: [-55.75, -12.58, -55.69, -12.51]
    },
    sensor: 'GoogleSatelliteEmbedding',
    channels: 64,
    previewUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
    defaultClassId: 'AnnualCrop',
    simulatedBands: {
      rgb: [0.38, 0.49, 0.22],
      nir: 0.72,
      redEdge: 0.58,
      swir: 0.21,
      ndvi: 0.78,
      ndre: 0.42,
      embeddingVectorSample: [0.82, -0.41, 0.65, 0.12, -0.78, 0.94, 0.33, -0.19, 0.51, -0.63, 0.77, 0.05, 0.39, -0.22, 0.88, 0.14]
    },
    timeSeriesHistory: [
      { year: 2020, primaryClass: 'Pasture', forestCoverPct: 15, cropCoverPct: 35, pastureCoverPct: 48, waterCoverPct: 2, ndviMean: 0.52 },
      { year: 2021, primaryClass: 'AnnualCrop', forestCoverPct: 14, cropCoverPct: 58, pastureCoverPct: 26, waterCoverPct: 2, ndviMean: 0.64 },
      { year: 2022, primaryClass: 'AnnualCrop', forestCoverPct: 14, cropCoverPct: 72, pastureCoverPct: 12, waterCoverPct: 2, ndviMean: 0.72 },
      { year: 2023, primaryClass: 'AnnualCrop', forestCoverPct: 13, cropCoverPct: 79, pastureCoverPct: 6, waterCoverPct: 2, ndviMean: 0.76 },
      { year: 2024, primaryClass: 'AnnualCrop', forestCoverPct: 13, cropCoverPct: 82, pastureCoverPct: 3, waterCoverPct: 2, ndviMean: 0.79 }
    ]
  },
  {
    id: 'sample-am-rainforest',
    name: {
      'pt-BR': 'Reserva Tapajós - Pará (Floresta Nativa Densa)',
      en: 'Tapajós Reserve - Pará (Primary Dense Rainforest)',
      es: 'Reserva Tapajós - Pará (Bosque Tropical Primario)'
    },
    region: 'Santarém / Belterra, PA - Brasil',
    biome: {
      'pt-BR': 'Amazônia Primária',
      en: 'Primary Amazon Rainforest',
      es: 'Amazonía Primaria'
    },
    coordinates: {
      lat: -2.8912,
      lng: -54.9542,
      bbox: [-55.02, -2.95, -54.88, -2.83]
    },
    sensor: 'GoogleSatelliteEmbedding',
    channels: 64,
    previewUrl: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&auto=format&fit=crop&q=80',
    defaultClassId: 'Forest',
    simulatedBands: {
      rgb: [0.12, 0.28, 0.14],
      nir: 0.88,
      redEdge: 0.69,
      swir: 0.09,
      ndvi: 0.89,
      ndre: 0.61,
      embeddingVectorSample: [-0.65, 0.92, -0.34, 0.81, 0.44, -0.73, 0.88, 0.29, -0.55, 0.76, -0.18, 0.62, -0.89, 0.45, 0.12, -0.67]
    },
    timeSeriesHistory: [
      { year: 2020, primaryClass: 'Forest', forestCoverPct: 96, cropCoverPct: 0, pastureCoverPct: 0, waterCoverPct: 4, ndviMean: 0.88 },
      { year: 2021, primaryClass: 'Forest', forestCoverPct: 95, cropCoverPct: 0, pastureCoverPct: 1, waterCoverPct: 4, ndviMean: 0.87 },
      { year: 2022, primaryClass: 'Forest', forestCoverPct: 95, cropCoverPct: 1, pastureCoverPct: 1, waterCoverPct: 3, ndviMean: 0.88 },
      { year: 2023, primaryClass: 'Forest', forestCoverPct: 94, cropCoverPct: 1, pastureCoverPct: 1, waterCoverPct: 4, ndviMean: 0.89 },
      { year: 2024, primaryClass: 'Forest', forestCoverPct: 94, cropCoverPct: 1, pastureCoverPct: 1, waterCoverPct: 4, ndviMean: 0.89 }
    ]
  },
  {
    id: 'sample-pantanal-wetland',
    name: {
      'pt-BR': 'Pantanal Sul-Mato-Grossense (Bacia Hidrográfica)',
      en: 'Pantanal Wetland Basin (Fluvial & Grassland)',
      es: 'Humedal del Pantanal (Cuenca Fluvial y Pastizales)'
    },
    region: 'Corumbá, MS - Brasil',
    biome: {
      'pt-BR': 'Pantanal',
      en: 'Pantanal Wetlands',
      es: 'Humedales del Pantanal'
    },
    coordinates: {
      lat: -19.0083,
      lng: -57.6534,
      bbox: [-57.72, -19.08, -57.58, -18.94]
    },
    sensor: 'Sentinel2_L2A',
    channels: 12,
    previewUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80',
    defaultClassId: 'River',
    simulatedBands: {
      rgb: [0.08, 0.18, 0.32],
      nir: 0.14,
      redEdge: 0.19,
      swir: 0.04,
      ndvi: 0.32,
      ndre: 0.18,
      embeddingVectorSample: [0.12, -0.88, 0.45, -0.62, 0.33, 0.79, -0.21, 0.54, -0.91, 0.08, 0.63, -0.47, 0.19, 0.77, -0.34, 0.58]
    },
    timeSeriesHistory: [
      { year: 2020, primaryClass: 'River', forestCoverPct: 22, cropCoverPct: 2, pastureCoverPct: 28, waterCoverPct: 48, ndviMean: 0.42 },
      { year: 2021, primaryClass: 'River', forestCoverPct: 20, cropCoverPct: 3, pastureCoverPct: 35, waterCoverPct: 42, ndviMean: 0.38 },
      { year: 2022, primaryClass: 'River', forestCoverPct: 21, cropCoverPct: 2, pastureCoverPct: 32, waterCoverPct: 45, ndviMean: 0.41 },
      { year: 2023, primaryClass: 'River', forestCoverPct: 19, cropCoverPct: 4, pastureCoverPct: 38, waterCoverPct: 39, ndviMean: 0.36 },
      { year: 2024, primaryClass: 'River', forestCoverPct: 21, cropCoverPct: 3, pastureCoverPct: 30, waterCoverPct: 46, ndviMean: 0.44 }
    ]
  },
  {
    id: 'sample-sp-industrial',
    name: {
      'pt-BR': 'Vale do Paraíba - São José dos Campos (Hub Industrial)',
      en: 'Paraíba Valley - São José dos Campos (Industrial Hub)',
      es: 'Valle de Paraíba - São José dos Campos (Polo Industrial)'
    },
    region: 'São José dos Campos, SP - Brasil',
    biome: {
      'pt-BR': 'Mata Atlântica / Urbano Consolidado',
      en: 'Atlantic Forest / Dense Urban Fabric',
      es: 'Mata Atlántica / Tejido Urbano Denso'
    },
    coordinates: {
      lat: -23.1896,
      lng: -45.8841,
      bbox: [-45.94, -23.24, -45.82, -23.14]
    },
    sensor: 'GoogleSatelliteEmbedding',
    channels: 64,
    previewUrl: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=800&auto=format&fit=crop&q=80',
    defaultClassId: 'Industrial',
    simulatedBands: {
      rgb: [0.55, 0.54, 0.56],
      nir: 0.31,
      redEdge: 0.35,
      swir: 0.62,
      ndvi: 0.18,
      ndre: 0.12,
      embeddingVectorSample: [-0.22, 0.15, -0.76, 0.89, -0.42, 0.31, -0.68, 0.53, 0.11, -0.84, 0.29, -0.45, 0.77, -0.19, 0.64, -0.38]
    },
    timeSeriesHistory: [
      { year: 2020, primaryClass: 'Industrial', forestCoverPct: 18, cropCoverPct: 0, pastureCoverPct: 12, waterCoverPct: 2, ndviMean: 0.25 },
      { year: 2021, primaryClass: 'Industrial', forestCoverPct: 16, cropCoverPct: 0, pastureCoverPct: 10, waterCoverPct: 2, ndviMean: 0.23 },
      { year: 2022, primaryClass: 'Industrial', forestCoverPct: 14, cropCoverPct: 0, pastureCoverPct: 8, waterCoverPct: 2, ndviMean: 0.21 },
      { year: 2023, primaryClass: 'Industrial', forestCoverPct: 12, cropCoverPct: 0, pastureCoverPct: 6, waterCoverPct: 2, ndviMean: 0.19 },
      { year: 2024, primaryClass: 'Industrial', forestCoverPct: 11, cropCoverPct: 0, pastureCoverPct: 4, waterCoverPct: 2, ndviMean: 0.18 }
    ]
  },
  {
    id: 'sample-mg-coffee',
    name: {
      'pt-BR': 'Sul de Minas - Guaxupé (Lavoura de Café Conilon/Arábica)',
      en: 'Sul de Minas - Guaxupé (Coffee Plantation)',
      es: 'Sur de Minas - Guaxupé (Plantación de Café)'
    },
    region: 'Guaxupé, MG - Brasil',
    biome: {
      'pt-BR': 'Mata Atlântica / Planalto Mineiro',
      en: 'Atlantic Plateau / Agroforestry',
      es: 'Meseta Atlántica / Agroforestería'
    },
    coordinates: {
      lat: -21.3056,
      lng: -46.7128,
      bbox: [-46.77, -21.36, -46.65, -21.25]
    },
    sensor: 'GoogleSatelliteEmbedding',
    channels: 64,
    previewUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
    defaultClassId: 'PermanentCrop',
    simulatedBands: {
      rgb: [0.29, 0.42, 0.24],
      nir: 0.68,
      redEdge: 0.52,
      swir: 0.28,
      ndvi: 0.69,
      ndre: 0.38,
      embeddingVectorSample: [0.44, 0.29, -0.58, 0.71, -0.36, 0.85, 0.12, -0.49, 0.63, -0.27, 0.81, 0.19, -0.52, 0.68, -0.14, 0.41]
    },
    timeSeriesHistory: [
      { year: 2020, primaryClass: 'PermanentCrop', forestCoverPct: 24, cropCoverPct: 56, pastureCoverPct: 18, waterCoverPct: 2, ndviMean: 0.62 },
      { year: 2021, primaryClass: 'PermanentCrop', forestCoverPct: 24, cropCoverPct: 59, pastureCoverPct: 15, waterCoverPct: 2, ndviMean: 0.65 },
      { year: 2022, primaryClass: 'PermanentCrop', forestCoverPct: 25, cropCoverPct: 62, pastureCoverPct: 11, waterCoverPct: 2, ndviMean: 0.67 },
      { year: 2023, primaryClass: 'PermanentCrop', forestCoverPct: 25, cropCoverPct: 65, pastureCoverPct: 8, waterCoverPct: 2, ndviMean: 0.68 },
      { year: 2024, primaryClass: 'PermanentCrop', forestCoverPct: 26, cropCoverPct: 67, pastureCoverPct: 5, waterCoverPct: 2, ndviMean: 0.69 }
    ]
  }
];

export const DEEP_LEARNING_MODELS: DeepLearningModel[] = [
  {
    id: 'resnet50',
    name: 'ResNet-50 (Residual Deep Network)',
    family: 'CNN',
    parameters: '25.6M',
    supports64Bands: true,
    adapterRequired: true,
    adapterInfo: {
      'pt-BR': 'Utiliza EmbeddingAdapter 1x1 Conv com projeção 64->64 sem perda de bandas.',
      en: 'Employs EmbeddingAdapter 1x1 Conv projection (64->64) without band truncation.',
      es: 'Utiliza EmbeddingAdapter 1x1 Conv con proyección 64->64 sin truncamiento de bandas.'
    },
    inferenceLatencyMs: 34,
    f1Score: 0.984,
    accuracy: 0.986,
    topClassScores: {
      AnnualCrop: 0.989,
      Forest: 0.995,
      HerbaceousVegetation: 0.978,
      Highway: 0.969,
      Industrial: 0.974,
      Pasture: 0.981,
      PermanentCrop: 0.979,
      Residential: 0.982,
      River: 0.991,
      SeaLake: 0.994
    },
    description: {
      'pt-BR': 'Rede neural convolucional residual com 50 camadas, padrão da indústria para classificação espectral com baixíssima latência.',
      en: '50-layer deep residual convolutional network, industry standard for spectral classification with ultra-low latency.',
      es: 'Red neuronal convolucional residual de 50 capas, estándar de la industria para clasificación espectral.'
    }
  },
  {
    id: 'vit_b16',
    name: 'ViT-B/16 (Vision Transformer Base)',
    family: 'Transformer',
    parameters: '86.4M',
    supports64Bands: true,
    adapterRequired: true,
    adapterInfo: {
      'pt-BR': 'Patch projection linear direta de 64 canais para embedding dimensional 768.',
      en: 'Direct 64-channel linear patch projection into 768-dimensional token space.',
      es: 'Proyección lineal directa de parches de 64 canales al espacio de 768 dimensiones.'
    },
    inferenceLatencyMs: 62,
    f1Score: 0.989,
    accuracy: 0.991,
    topClassScores: {
      AnnualCrop: 0.993,
      Forest: 0.997,
      HerbaceousVegetation: 0.984,
      Highway: 0.978,
      Industrial: 0.985,
      Pasture: 0.988,
      PermanentCrop: 0.986,
      Residential: 0.989,
      River: 0.994,
      SeaLake: 0.996
    },
    description: {
      'pt-BR': 'Arquitetura baseada em Self-Attention global capaz de capturar relações de longo alcance entre pixels e padrões texturais.',
      en: 'Global Self-Attention architecture excelling at capturing long-range spatial context and texture patterns.',
      es: 'Arquitectura basada en autoatención global que captura relaciones espaciales y de textura.'
    }
  },
  {
    id: 'swin_tiny',
    name: 'Swin-Tiny (Shifted Windows Transformer)',
    family: 'Transformer',
    parameters: '28.3M',
    supports64Bands: true,
    adapterRequired: true,
    adapterInfo: {
      'pt-BR': 'Hierarchical Patch Merging adaptado para tensores geoespaciais multiespectrais.',
      en: 'Hierarchical Patch Merging tailored for multispectral geospatial tensors.',
      es: 'Patch Merging jerárquico adaptado para tensores multiespectrales geoespaciales.'
    },
    inferenceLatencyMs: 44,
    f1Score: 0.987,
    accuracy: 0.989,
    topClassScores: {
      AnnualCrop: 0.991,
      Forest: 0.996,
      HerbaceousVegetation: 0.981,
      Highway: 0.975,
      Industrial: 0.982,
      Pasture: 0.984,
      PermanentCrop: 0.983,
      Residential: 0.987,
      River: 0.992,
      SeaLake: 0.995
    },
    description: {
      'pt-BR': 'Transformer com janelas deslizantes que une eficiência computacional linear à alta acurácia espectral.',
      en: 'Shifted-window Transformer offering linear computational complexity and peak spectral accuracy.',
      es: 'Transformador de ventanas desplazadas con complejidad lineal y máxima precisión espectral.'
    }
  },
  {
    id: 'efficientnet_b0',
    name: 'EfficientNet-B0 (Edge-Optimized CNN)',
    family: 'CNN',
    parameters: '5.3M',
    supports64Bands: true,
    adapterRequired: true,
    adapterInfo: {
      'pt-BR': 'MBConv blocks com canais de entrada escalonados para 64 dimensões.',
      en: 'MBConv blocks with input channel scaling mapped to 64 dimensions.',
      es: 'Bloques MBConv con escalado de canales de entrada mapeados a 64 dimensiones.'
    },
    inferenceLatencyMs: 18,
    f1Score: 0.978,
    accuracy: 0.981,
    topClassScores: {
      AnnualCrop: 0.982,
      Forest: 0.992,
      HerbaceousVegetation: 0.971,
      Highway: 0.962,
      Industrial: 0.968,
      Pasture: 0.975,
      PermanentCrop: 0.972,
      Residential: 0.977,
      River: 0.986,
      SeaLake: 0.989
    },
    description: {
      'pt-BR': 'Modelo ultraleve otimizado para inferência on-edge e pipelines de altíssimo throughput (1000+ tiles/s).',
      en: 'Ultra-lightweight model tuned for on-edge processing and high-throughput streaming (1000+ tiles/s).',
      es: 'Modelo ultraligero optimizado para inferencia en el borde y procesamiento de alto rendimiento.'
    }
  },
  {
    id: 'hybrid_cnn_vit',
    name: 'Hybrid CNN-Transformer (Triminds SOTA)',
    family: 'Hybrid',
    parameters: '44.8M',
    supports64Bands: true,
    adapterRequired: true,
    adapterInfo: {
      'pt-BR': 'Stem convolucional 64-bandas seguido por blocos Transformer com Cross-Attention.',
      en: '64-band convolutional stem followed by Cross-Attention Transformer blocks.',
      es: 'Stem convolucional de 64 bandas seguido por bloques Transformer con Cross-Attention.'
    },
    inferenceLatencyMs: 48,
    f1Score: 0.992,
    accuracy: 0.994,
    topClassScores: {
      AnnualCrop: 0.996,
      Forest: 0.999,
      HerbaceousVegetation: 0.989,
      Highway: 0.984,
      Industrial: 0.989,
      Pasture: 0.991,
      PermanentCrop: 0.990,
      Residential: 0.992,
      River: 0.997,
      SeaLake: 0.998
    },
    description: {
      'pt-BR': 'Modelo de ponta proprietário Triminds combinando extração local convolucional e atenção global para mapeamento complexo de uso do solo.',
      en: 'State-of-the-art hybrid architecture fusing local convolutional spatial features with global attention.',
      es: 'Arquitectura híbrida de vanguardia que fusiona convolución local con atención global.'
    }
  }
];

export const SIMULATED_DRIFT_METRICS: DriftBandMetric[] = [
  { bandIndex: 1, bandName: 'Emb_Band_01 (Blue-Absorption)', wavelengthNm: '440nm', baselineMean: 0.342, currentMean: 0.349, baselineStd: 0.051, currentStd: 0.052, psi: 0.024, ksStatistic: 0.031, pValue: 0.42, driftStatus: 'STABLE' },
  { bandIndex: 2, bandName: 'Emb_Band_02 (Chlorophyll-Green)', wavelengthNm: '560nm', baselineMean: 0.485, currentMean: 0.491, baselineStd: 0.062, currentStd: 0.061, psi: 0.018, ksStatistic: 0.027, pValue: 0.58, driftStatus: 'STABLE' },
  { bandIndex: 3, bandName: 'Emb_Band_03 (Red-Edge Peak)', wavelengthNm: '705nm', baselineMean: 0.612, currentMean: 0.724, baselineStd: 0.078, currentStd: 0.114, psi: 0.285, ksStatistic: 0.189, pValue: 0.002, driftStatus: 'CRITICAL' },
  { bandIndex: 4, bandName: 'Emb_Band_04 (NIR Plateau)', wavelengthNm: '842nm', baselineMean: 0.781, currentMean: 0.892, baselineStd: 0.084, currentStd: 0.132, psi: 0.241, ksStatistic: 0.165, pValue: 0.006, driftStatus: 'CRITICAL' },
  { bandIndex: 5, bandName: 'Emb_Band_05 (Water Absorption)', wavelengthNm: '945nm', baselineMean: 0.154, currentMean: 0.162, baselineStd: 0.038, currentStd: 0.041, psi: 0.045, ksStatistic: 0.048, pValue: 0.21, driftStatus: 'STABLE' },
  { bandIndex: 6, bandName: 'Emb_Band_06 (SWIR-1 Moisture)', wavelengthNm: '1610nm', baselineMean: 0.289, currentMean: 0.345, baselineStd: 0.056, currentStd: 0.079, psi: 0.128, ksStatistic: 0.098, pValue: 0.034, driftStatus: 'WARNING' },
  { bandIndex: 7, bandName: 'Emb_Band_07 (SWIR-2 Soil/Mineral)', wavelengthNm: '2190nm', baselineMean: 0.211, currentMean: 0.219, baselineStd: 0.049, currentStd: 0.050, psi: 0.032, ksStatistic: 0.039, pValue: 0.35, driftStatus: 'STABLE' },
  { bandIndex: 8, bandName: 'Emb_Band_08 (Latent Feature 08)', baselineMean: 0.512, currentMean: 0.508, baselineStd: 0.071, currentStd: 0.069, psi: 0.012, ksStatistic: 0.021, pValue: 0.74, driftStatus: 'STABLE' },
  { bandIndex: 16, bandName: 'Emb_Band_16 (Latent Feature 16)', baselineMean: -0.245, currentMean: -0.239, baselineStd: 0.082, currentStd: 0.084, psi: 0.015, ksStatistic: 0.025, pValue: 0.65, driftStatus: 'STABLE' },
  { bandIndex: 32, bandName: 'Emb_Band_32 (Latent Feature 32)', baselineMean: 0.684, currentMean: 0.691, baselineStd: 0.065, currentStd: 0.067, psi: 0.021, ksStatistic: 0.029, pValue: 0.49, driftStatus: 'STABLE' },
  { bandIndex: 48, bandName: 'Emb_Band_48 (Latent Feature 48)', baselineMean: -0.512, currentMean: -0.498, baselineStd: 0.091, currentStd: 0.088, psi: 0.028, ksStatistic: 0.035, pValue: 0.38, driftStatus: 'STABLE' },
  { bandIndex: 64, bandName: 'Emb_Band_64 (Latent Feature 64)', baselineMean: 0.419, currentMean: 0.425, baselineStd: 0.074, currentStd: 0.073, psi: 0.019, ksStatistic: 0.026, pValue: 0.61, driftStatus: 'STABLE' },
];
