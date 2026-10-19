import { randomUUID } from 'crypto';
import {
  AnalysisJob,
  AnalysisResult,
  BBox,
  GeoJSONPolygon,
  PipelineStage,
  SatelliteScene
} from '../types';
import { validateROI } from './roiValidator';
import { publicStacSentinelProvider } from './satelliteProvider';
import {
  calculateEVI,
  calculateNDRE,
  calculateNDVI,
  computePixelStatistics,
  extractSentinelRasterStack
} from './spectralProcessor';
import { classifySpectralTensor } from './geoAiClassifier';
import { calculateCarbonAudit } from './carbonAudit';

export interface StartAnalysisRequest {
  farmName?: string;
  regionName?: string;
  biome?: string;
  geometry: any; // GeoJSON Polygon or BBox
  selectedModel?: string;
  preferredProvider?: string;
  dateRange?: { from: string; to: string };
  maxCloudCover?: number;
}

// In-memory Job Queue & Result Cache
const JOBS_DB = new Map<string, AnalysisJob>();
const RESULTS_DB = new Map<string, AnalysisResult>();

export class GeoSpatialPipelineService {
  /**
   * Initializes and queues a real geospatial analysis job.
   */
  startJob(request: StartAnalysisRequest, ownerUsername: string): { jobId: string; status: PipelineStage } {
    const jobId = `geoai_${Date.now()}_${randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    const job: AnalysisJob = {
      id: jobId,
      ownerUsername,
      status: 'queued',
      progressPct: 5,
      stageMessage: 'Job enfileirado na pipeline geoespacial v4...',
      createdAt: now,
      updatedAt: now
    };

    JOBS_DB.set(jobId, job);

    // Asynchronously trigger execution immediately
    setImmediate(() => {
      this.executeJob(jobId, request).catch(err => {
        console.error(`[Pipeline Error] Job ${jobId} falhou:`, err);
        const current = JOBS_DB.get(jobId);
        if (current) {
          const isDataUnavailable = err.message && (err.message.includes('DATA_UNAVAILABLE') || err.message.includes('não encontrada'));
          current.status = isDataUnavailable ? 'DATA_UNAVAILABLE' : 'failed';
          current.errorCode = isDataUnavailable ? 'DATA_UNAVAILABLE' : 'PROCESSING_ERROR';
          current.error = err.message || 'Erro durante a execução da pipeline.';
          current.updatedAt = new Date().toISOString();
        }
      });
    });

    return { jobId, status: 'queued' };
  }

  getJob(jobId: string): AnalysisJob | undefined {
    return JOBS_DB.get(jobId);
  }

  getResult(jobId: string): AnalysisResult | undefined {
    return RESULTS_DB.get(jobId);
  }

  private updateJobProgress(jobId: string, status: PipelineStage, progressPct: number, message: string) {
    const job = JOBS_DB.get(jobId);
    if (!job) return;
    job.status = status;
    job.progressPct = progressPct;
    job.stageMessage = message;
    job.updatedAt = new Date().toISOString();
  }

  /**
   * Complete real step-by-step geospatial execution using real satellite assets.
   */
  private async executeJob(jobId: string, request: StartAnalysisRequest): Promise<void> {
    const startTime = performance.now();
    const correlationId = `corr_${randomUUID()}`;

    // STAGE 1: ROI Validation
    this.updateJobProgress(jobId, 'validating_roi', 15, 'Validando topologia WGS84 e calculando área geodésica...');
    const roiValidation = validateROI(request.geometry);
    if (!roiValidation.valid || !roiValidation.geometry || !roiValidation.bbox) {
      throw new Error(`Falha na validação do ROI: ${roiValidation.errors.join(', ')}`);
    }

    const { geometry, bbox, centroid, areaHectares } = roiValidation;
    const biome = request.biome || 'Cerrado';
    const farmName = request.farmName || 'Área de Monitoramento GeoAI';
    const regionName = request.regionName || 'Região Agrícola Selecionada';
    const maxCloud = request.maxCloudCover ?? 30;

    // STAGE 2: Satellite Acquisition (STAC search for real Sentinel-2 scenes)
    this.updateJobProgress(jobId, 'searching_satellite', 30, 'Consultando catálogo STAC para cenas Sentinel-2 L2A reais...');
    let scenes: SatelliteScene[] = [];

    try {
      scenes = await publicStacSentinelProvider.searchScenes(geometry, {
        dateRange: request.dateRange,
        maxCloudCover: maxCloud,
        limit: 5
      });
    } catch (stacErr: any) {
      throw new Error(`DATA_UNAVAILABLE: Falha de conexão com catálogo STAC Sentinel-2: ${stacErr.message}`);
    }

    if (!scenes || scenes.length === 0) {
      throw new Error(
        `DATA_UNAVAILABLE: Nenhuma cena Sentinel-2 L2A com cobertura de nuvens <= ${maxCloud}% foi encontrada para o ROI e período selecionados no catálogo STAC.`
      );
    }

    const chosenScene = scenes[0];
    const providerName = chosenScene.provider || 'Copernicus Sentinel-2 L2A (STAC Earth Search)';
    const datasetName = chosenScene.collection || 'sentinel-2-l2a';

    // STAGE 3: Preprocessing & Real Raster Grid Assembly
    this.updateJobProgress(
      jobId,
      'acquiring_raster',
      45,
      `Baixando tensores multiespectrais reais da cena ${chosenScene.id} via COG...`
    );

    let rasterStack;
    try {
      rasterStack = await extractSentinelRasterStack(chosenScene, bbox, { maxDimension: 128 });
    } catch (rasterErr: any) {
      throw new Error(`DATA_UNAVAILABLE: Falha ao baixar ativos raster reais da cena Sentinel-2: ${rasterErr.message}`);
    }

    // STAGE 4: Spectral Indices Computation on real pixels
    this.updateJobProgress(jobId, 'computing_indices', 60, 'Calculando matrizes matemáticas de NDVI, NDRE e EVI a partir dos pixels reais...');
    const ndviMatrix = calculateNDVI(rasterStack.nir, rasterStack.red);
    const ndreMatrix = calculateNDRE(rasterStack.nir, rasterStack.redEdge);
    const eviMatrix = calculateEVI(rasterStack.nir, rasterStack.red, rasterStack.blue);

    // Real descriptive statistics
    const ndviStats = computePixelStatistics(ndviMatrix, -0.2, 1.0);
    const ndreStats = computePixelStatistics(ndreMatrix, -0.2, 1.0);
    const eviStats = computePixelStatistics(eviMatrix, 0.0, 1.2);

    // STAGE 5: Geo-AI Inference (Rule-based spectral LULC classification)
    this.updateJobProgress(jobId, 'running_inference', 75, `Executando classificador espectral determinístico (não é inferência de CNN/Transformer)...`);
    
    const classification = classifySpectralTensor(rasterStack, ndviMatrix, ndreMatrix, eviMatrix);

    // STAGE 6: Spatial Statistics, Carbon Stock & CAR Indicators
    this.updateJobProgress(jobId, 'spatial_statistics', 88, 'Calculando indicador de Reserva Legal (CAR) e auditoria de carbono...');
    
    const isAmazonia = biome.toLowerCase().includes('amazôn');
    const requiredPreservationPct = isAmazonia ? 80 : 20;

    const forestClass = classification.classes.find(c => c.classId === 'Forest');
    const actualPreservationPct = forestClass ? forestClass.percentage : 0;
    const actualForestHa = forestClass ? forestClass.hectares : 0;

    const requiredForestHa = (areaHectares! * requiredPreservationPct) / 100;
    const surplusHa = Number(Math.max(0, actualForestHa - requiredForestHa).toFixed(2));
    const carStatus = actualPreservationPct >= requiredPreservationPct ? 'CONFORME' : 'EM_ANALISE';

    const carbonAudit = calculateCarbonAudit(classification.classes, biome, areaHectares!);

    // STAGE 7: Evidence & Provenance
    this.updateJobProgress(jobId, 'generating_evidence', 95, 'Consolidando proveniência e exportações GeoJSON...');

    const endTime = performance.now();
    const totalProcessingTimeMs = Number((endTime - startTime).toFixed(2));

    const assetUrls: Record<string, string> = {};
    if (chosenScene.assets) {
      if (chosenScene.assets.red?.href) assetUrls.red = chosenScene.assets.red.href;
      if (chosenScene.assets.nir?.href) assetUrls.nir = chosenScene.assets.nir.href;
      if (chosenScene.assets.blue?.href) assetUrls.blue = chosenScene.assets.blue.href;
      if (chosenScene.assets.green?.href) assetUrls.green = chosenScene.assets.green.href;
      if (chosenScene.assets.rededge1?.href) assetUrls.rededge = chosenScene.assets.rededge1.href;
      if (chosenScene.assets.swir16?.href) assetUrls.swir = chosenScene.assets.swir16.href;
    }

    const provenance = {
      correlationId,
      analysisId: jobId,
      pipelineVersion: '4.0.0-real-sentinel2',
      requestedModel: request.selectedModel || 'not-specified',
      provider: providerName,
      dataset: datasetName,
      sceneId: chosenScene.id,
      acquisitionDate: chosenScene.datetime,
      cloudCoveragePct: chosenScene.cloudCoverPct,
      sunElevationDeg: chosenScene.sunElevationDeg,
      bandsUsed: ['B02_Blue', 'B03_Green', 'B04_Red', 'B05_RedEdge', 'B08_NIR', 'B11_SWIR'],
      spatialResolutionMeters: rasterStack.resolutionMeters,
      totalPixelsProcessed: classification.pixelsProcessed,
      processingDurationMs: totalProcessingTimeMs,
      assetUrls,
      crs: 'EPSG:4326',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production'
    };

    let healthText = 'Excelente (Alto Vigor Fotossintético)';
    if (ndviStats.mean < 0.40) healthText = 'Baixo Vigor / Área em Pousio ou Solo Exposto';
    else if (ndviStats.mean < 0.65) healthText = 'Vigor Moderado (Cultura em Desenvolvimento)';

    const finalResult: AnalysisResult = {
      analysisId: jobId,
      farmName,
      region: regionName,
      biome,
      geometry,
      bbox,
      centroid: centroid!,
      totalHectares: areaHectares!,
      executionMetrics: {
        inferenceTimeMs: classification.inferenceTimeMs,
        totalProcessingTimeMs,
        pixelsProcessed: classification.pixelsProcessed,
        spatialResolutionMeters: rasterStack.resolutionMeters,
        modelsExecuted: ['Rule-Based-Spectral-Classifier-v4']
      },
      vegetation: {
        ndvi: ndviStats,
        ndre: ndreStats,
        eviMean: eviStats.mean,
        healthAssessment: healthText
      },
      lulcBreakdown: classification.classes,
      compliance: {
        carStatus,
        biomeTarget: isAmazonia ? 'Amazônia (Exigência Reserva Legal 80%)' : 'Cerrado (Exigência Reserva Legal 20% / 35%)',
        requiredPreservationPct,
        actualPreservationPct,
        preservationSurplusHa: surplusHa,
        disclaimer: 'Indicador computacional preliminar de conformidade com o Código Florestal Brasileiro (Lei 12.651/2012). Não constitui validação legal perante órgãos ambientais (SICAR / Órgãos Estaduais).',
        isLegalCertification: false,
        nature: 'computational_indicator'
      },
      carbonAudit,
      provenance,
      vectorGeoJson: classification.vectorGeoJson
    };

    // Save result to cache
    RESULTS_DB.set(jobId, finalResult);

    const job = JOBS_DB.get(jobId);
    if (job) {
      job.status = 'completed';
      job.progressPct = 100;
      job.stageMessage = 'Análise geoespacial com dados reais concluída com sucesso.';
      job.completedAt = new Date().toISOString();
      job.updatedAt = new Date().toISOString();
      job.result = finalResult;
    }
  }
}

export const pipelineService = new GeoSpatialPipelineService();

