export type Language = 'pt-BR' | 'en' | 'es';

export interface LandCoverClass {
  id: string;
  code: string;
  name: Record<Language, string>;
  description: Record<Language, string>;
  color: string;
}

export interface ModelMetadata {
  id: string;
  name: string;
  family: 'CNN' | 'Transformer' | 'Hybrid';
  parameters: string;
  supports64Bands: boolean;
  adapterRequired: boolean;
  inferenceLatencyMs: number;
  f1Score: number;
  accuracy: number;
}

export interface AuditPhase {
  id: 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5';
  number: number;
  title: Record<Language, string>;
  initialStatus: 'PASS' | 'PARTIAL' | 'WARNING';
  finalStatus: 'PRODUCTION_READY';
  summary: Record<Language, string>;
  keyFixes: {
    title: Record<Language, string>;
    description: Record<Language, string>;
    status: 'RESOLVED' | 'VERIFIED';
    codeSnippet?: string;
  }[];
}

export interface DataLineageNode {
  id: string;
  stage: 'dataset' | 'preprocessing' | 'feature_extractor' | 'training_run' | 'artifact' | 'evaluation';
  name: string;
  version: string;
  hash: string;
  timestamp: string;
  metadata: Record<string, string | number>;
  status: 'valid' | 'verified';
}

export interface GovernanceGate {
  id: string;
  stepName: string;
  status: 'passed' | 'active' | 'pending';
  rule: string;
  metricTarget: string;
  actualMetric: string;
  signOffBy: string;
}

export type MapSourceType = 
  | 'google_earth_engine'
  | 'google_satellite_embedding'
  | 'google_maps_satellite'
  | 'landsat9_oli2'
  | 'planetscope_superdove';

export type MapDataFormat = 
  | 'cog_float32'
  | 'gee_asset_image'
  | 'zarr_64channel_array'
  | 'geojson_wgs84'
  | 'safe_sentinel2';

export interface MapSourceDefinition {
  id: MapSourceType;
  name: string;
  provider: string;
  availableFormats: {
    format: MapDataFormat;
    label: string;
    description: string;
    recommended: boolean;
  }[];
  resolution: string;
  bandCount: number;
  description: string;
  cloudCoverageThresholdPct: number;
  tileUrlPattern?: string;
  badgeColor: string;
}

export interface SavedAreaAnalysis {
  id: string;
  title: string;
  farmName: string;
  region: string;
  biome: string;
  sourceType: MapSourceType;
  sourceFormat: MapDataFormat;
  center: { lat: number; lng: number };
  bbox: [number, number, number, number]; // [west, south, east, north]
  /** Original analysis geometry (GeoJSON) so reopening a saved analysis preserves its ROI. */
  geometry?: { type: 'Polygon'; coordinates: number[][][] };
  areaHectares: number;
  selectedModel: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  author: string;
  authorRole: 'admin' | 'operador' | 'operator';
  status: 'analyzed' | 'pending';
  results: {
    meanNdvi: number;
    meanNdre: number;
    carbonStockTon: number;
    carStatus: 'CONFORME' | 'EM_ANALISE' | 'RESTRICAO';
    macroF1: number;
    classBreakdown: {
      classId: string;
      className: string;
      hectares: number;
      percentage: number;
      color: string;
    }[];
  };
}
