export interface LatLng {
  lat: number;
  lng: number;
}

export type BBox = [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][]; // [ [ [lng, lat], [lng, lat], ... ] ]
}

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: GeoJSONPolygon;
  properties: Record<string, any>;
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export interface ROIValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  geometry?: GeoJSONPolygon;
  bbox?: BBox;
  centroid?: LatLng;
  areaHectares?: number;
  perimeterKm?: number;
  vertexCount?: number;
}

export interface SatelliteScene {
  id: string;
  collection: string;
  provider: string;
  datetime: string;
  cloudCoverPct: number;
  sunElevationDeg?: number;
  thumbnailUrl?: string;
  bbox: BBox;
  bandsAvailable: string[];
  assets?: Record<string, { href: string; title?: string }>;
}

export interface ProviderStatus {
  id: string;
  name: string;
  status: 'CONNECTED' | 'AVAILABLE' | 'NOT_CONFIGURED' | 'AUTH_REQUIRED' | 'UNAVAILABLE' | 'ERROR';
  message: string;
  checkedAt: string;
  details?: Record<string, any>;
}

export interface SpectralBandMatrix {
  width: number;
  height: number;
  resolutionMeters: number;
  bbox: BBox;
  blue: Float32Array;
  green: Float32Array;
  red: Float32Array;
  redEdge: Float32Array;
  nir: Float32Array;
  swir: Float32Array;
}

export interface StatisticalDistribution {
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
  p25: number;
  p75: number;
  histogram: { binStart: number; binEnd: number; count: number }[];
}

export interface LULCClassResult {
  classId: string;
  className: string;
  color: string;
  pixelCount: number;
  hectares: number;
  percentage: number;
  confidence: number;
}

export interface AnalysisProvenance {
  correlationId: string;
  analysisId: string;
  pipelineVersion: string;
  provider: string;
  dataset: string;
  sceneId?: string;
  acquisitionDate?: string;
  cloudCoveragePct?: number;
  bandsUsed: string[];
  spatialResolutionMeters: number;
  totalPixelsProcessed: number;
  processingDurationMs: number;
  timestamp: string;
  environment: string;
}

export interface CarbonAuditResult {
  methodology: string;
  standardReference: string;
  totalEstimatedStockTonCO2e: number;
  averageDensityTonHa: number;
  assumptions: string[];
  factorsUsed: Record<string, number>;
}

export interface AnalysisResult {
  analysisId: string;
  farmName: string;
  region: string;
  biome: string;
  geometry: GeoJSONPolygon;
  bbox: BBox;
  centroid: LatLng;
  totalHectares: number;
  executionMetrics: {
    inferenceTimeMs: number;
    totalProcessingTimeMs: number;
    pixelsProcessed: number;
    spatialResolutionMeters: number;
    modelsExecuted: string[];
  };
  vegetation: {
    ndvi: StatisticalDistribution;
    ndre: StatisticalDistribution;
    eviMean: number;
    healthAssessment: string;
  };
  lulcBreakdown: LULCClassResult[];
  compliance: {
    carStatus: 'CONFORME' | 'EM_ANALISE' | 'RESTRICAO';
    biomeTarget: string;
    requiredPreservationPct: number;
    actualPreservationPct: number;
    preservationSurplusHa: number;
  };
  carbonAudit: CarbonAuditResult;
  provenance: AnalysisProvenance;
  vectorGeoJson: GeoJSONFeatureCollection;
}

export type PipelineStage = 
  | 'queued'
  | 'validating_roi'
  | 'searching_satellite'
  | 'acquiring_raster'
  | 'computing_indices'
  | 'running_inference'
  | 'spatial_statistics'
  | 'generating_evidence'
  | 'completed'
  | 'failed';

export interface AnalysisJob {
  id: string;
  status: PipelineStage;
  progressPct: number;
  stageMessage: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  error?: string;
  result?: AnalysisResult;
}
