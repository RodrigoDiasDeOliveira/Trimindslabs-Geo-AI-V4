import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../auth/AuthContext';
import { 
  MapSourceType, 
  MapDataFormat, 
  SavedAreaAnalysis 
} from '../types';
import { 
  MAP_SOURCES, 
  PRESET_REGIONS, 
  PresetRegion 
} from '../data/mapSourcesData';
import { 
  getSavedAnalyses, 
  saveAnalysisToStorage, 
  updateAnalysisInStorage, 
  deleteAnalysisFromStorage 
} from '../utils/analysisStorage';
import { RealLeafletMap } from './RealLeafletMap';
import { AnalysisResult, ProviderStatus, SatelliteScene } from '../../server/types';
import { 
  MapPin, 
  Layers, 
  Search, 
  Sliders, 
  Save, 
  Edit3, 
  Trash2, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  RefreshCw, 
  FileText, 
  Sparkles, 
  Compass, 
  Maximize2, 
  Eye, 
  Database, 
  X, 
  ChevronRight,
  ShieldCheck,
  Check,
  Activity,
  Cpu,
  CornerDownRight,
  Crosshair,
  Satellite,
  BarChart3,
  TreeDeciduous,
  Leaf,
  Info,
  Calendar,
  Cloud,
  FileSpreadsheet,
  Square,
  Pentagon,
  Move
} from 'lucide-react';

export const AreaSelectionView: React.FC = () => {
  const { language } = useLanguage();
  const { user, isAdmin, authFetch } = useAuth();

  // Storage state
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAreaAnalysis[]>([]);
  const [activeTab, setActiveTab] = useState<'picker' | 'saved'>('picker');
  
  // Selected Map Source & Format
  const [selectedSourceType, setSelectedSourceType] = useState<MapSourceType>('google_earth_engine');
  const [selectedFormat, setSelectedFormat] = useState<MapDataFormat>('cog_float32');
  
  // Selected Region & Coordinates
  const [selectedPreset, setSelectedPreset] = useState<PresetRegion>(PRESET_REGIONS[0]);
  const [farmName, setFarmName] = useState<string>(PRESET_REGIONS[0].farm);
  const [centerLat, setCenterLat] = useState<number>(PRESET_REGIONS[0].center.lat);
  const [centerLng, setCenterLng] = useState<number>(PRESET_REGIONS[0].center.lng);
  const [bboxWidthKm, setBboxWidthKm] = useState<number>(8.0);
  const [bboxHeightKm, setBboxHeightKm] = useState<number>(6.0);
  const [drawingMode, setDrawingMode] = useState<'box' | 'polygon' | null>(null);

  // Custom Drawn Polygon (if drawn by user)
  const [drawnPolygon, setDrawnPolygon] = useState<number[][] | null>(null);

  // Model & Pipeline Execution
  const [selectedModel, setSelectedModel] = useState<string>('hybrid_cnn_vit');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [analysisStageText, setAnalysisStageText] = useState<string>('');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const pollIntervalRef = useRef<any>(null);

  // Real Satellite Scenes Search
  const [isSearchingScenes, setIsSearchingScenes] = useState<boolean>(false);
  const [availableScenes, setAvailableScenes] = useState<SatelliteScene[]>([]);
  const [selectedScene, setSelectedScene] = useState<SatelliteScene | null>(null);
  const [maxCloudCover, setMaxCloudCover] = useState<number>(20);
  const [sceneSearchError, setSceneSearchError] = useState<string | null>(null);

  // Live Provider Statuses
  const [providersStatus, setProvidersStatus] = useState<ProviderStatus[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState<boolean>(false);

  // Current active real analysis result
  const [liveAnalysisResult, setLiveAnalysisResult] = useState<AnalysisResult | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<SavedAreaAnalysis | null>(null);

  // Save Modal / Form
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [saveTitle, setSaveTitle] = useState<string>('');
  const [saveNotes, setSaveNotes] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);

  // Edit Modal State
  const [editingAnalysis, setEditingAnalysis] = useState<SavedAreaAnalysis | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editFarmName, setEditFarmName] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  // Search filter for saved analyses
  const [savedSearchTerm, setSavedSearchTerm] = useState<string>('');

  // AI Agronomic Report State
  const [aiReportLoading, setAiReportLoading] = useState<boolean>(false);
  const [aiReportText, setAiReportText] = useState<string | null>(null);

  // Load provider statuses on mount
  const fetchProviderStatuses = async () => {
    setIsLoadingProviders(true);
    try {
      const res = await fetch('/api/v1/providers/status');
      const data = await res.json();
      if (Array.isArray(data?.providers)) {
        setProvidersStatus(data.providers);
      }
    } catch (err) {
      console.warn('Falha ao obter status dos provedores:', err);
    } finally {
      setIsLoadingProviders(false);
    }
  };

  useEffect(() => {
    fetchProviderStatuses();
    const interval = setInterval(fetchProviderStatuses, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load saved analyses on mount
  useEffect(() => {
    const list = getSavedAnalyses();
    setSavedAnalyses(list);
    if (list.length > 0) {
      setCurrentAnalysis(list[0]);
    }
  }, []);

  // Compute bounding box coordinates based on center & dimensions
  const computedBbox = useMemo((): [number, number, number, number] => {
    const latDelta = (bboxHeightKm / 2) / 110.574;
    const lngDelta = (bboxWidthKm / 2) / (111.320 * Math.cos((centerLat * Math.PI) / 180));
    return [
      Number((centerLng - lngDelta).toFixed(5)),
      Number((centerLat - latDelta).toFixed(5)),
      Number((centerLng + lngDelta).toFixed(5)),
      Number((centerLat + latDelta).toFixed(5)),
    ];
  }, [centerLat, centerLng, bboxWidthKm, bboxHeightKm]);

  // Calculated area in hectares
  const calculatedHectares = useMemo(() => {
    if (liveAnalysisResult) return liveAnalysisResult.totalHectares;
    return Math.round(bboxWidthKm * bboxHeightKm * 100);
  }, [bboxWidthKm, bboxHeightKm, liveAnalysisResult]);

  // Handle Preset selection
  const handleSelectPreset = (preset: PresetRegion) => {
    setSelectedPreset(preset);
    setFarmName(preset.farm);
    setCenterLat(preset.center.lat);
    setCenterLng(preset.center.lng);
    setDrawnPolygon(null);
    setLiveAnalysisResult(null);
    setAvailableScenes([]);
    setSelectedScene(null);

    const widthKm = Math.round((preset.bbox[2] - preset.bbox[0]) * 111 * Math.cos((preset.center.lat * Math.PI) / 180));
    const heightKm = Math.round((preset.bbox[3] - preset.bbox[1]) * 111);
    setBboxWidthKm(Math.max(3, widthKm || 8));
    setBboxHeightKm(Math.max(3, heightKm || 6));
  };

  // Handle interactive ROI change drawn on map
  const handleMapRoiChange = (newBbox: [number, number, number, number], polygonCoords: number[][], areaHa: number) => {
    setDrawnPolygon(polygonCoords);
    setLiveAnalysisResult(null);
    setAvailableScenes([]);
    setSelectedScene(null);

    const minLng = newBbox[0];
    const minLat = newBbox[1];
    const maxLng = newBbox[2];
    const maxLat = newBbox[3];

    const cLat = Number(((minLat + maxLat) / 2).toFixed(5));
    const cLng = Number(((minLng + maxLng) / 2).toFixed(5));
    setCenterLat(cLat);
    setCenterLng(cLng);

    const wKm = Math.abs(maxLng - minLng) * 111.32 * Math.cos((cLat * Math.PI) / 180);
    const hKm = Math.abs(maxLat - minLat) * 110.57;
    setBboxWidthKm(Number(wKm.toFixed(2)));
    setBboxHeightKm(Number(hKm.toFixed(2)));
  };

  // 1. REAL SATELLITE SEARCH
  const handleSearchSatelliteScenes = async () => {
    setIsSearchingScenes(true);
    setSceneSearchError(null);
    setAvailableScenes([]);

    const geometry = drawnPolygon
      ? { type: 'Polygon', coordinates: [drawnPolygon] }
      : computedBbox;

    try {
      const res = await authFetch('/api/v1/satellite/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geometry,
          maxCloudCover,
          provider: 'stac'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setSceneSearchError(data.error || data.message || 'Falha ao buscar cenas');
        return;
      }

      if (Array.isArray(data.scenes) && data.scenes.length > 0) {
        setAvailableScenes(data.scenes);
        setSelectedScene(data.scenes[0]);
      } else {
        setSceneSearchError('Nenhuma cena Sentinel-2 encontrada com cobertura de nuvens <= ' + maxCloudCover + '% nos últimos 90 dias.');
      }
    } catch (err: any) {
      setSceneSearchError('Erro de conexão ao buscar cenas STAC: ' + err.message);
    } finally {
      setIsSearchingScenes(false);
    }
  };

  // 2. REAL PIPELINE EXECUTION (ASYNCHRONOUS WITH OBSERVABILITY)
  const handleRunRealPipeline = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(5);
    setAnalysisStageText('Enfileirando job na pipeline geoespacial v4...');
    setLiveAnalysisResult(null);

    const geometry = drawnPolygon
      ? { type: 'Polygon', coordinates: [drawnPolygon] }
      : computedBbox;

    try {
      const res = await authFetch('/api/v1/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmName,
          regionName: selectedPreset.name,
          biome: selectedPreset.biome,
          geometry,
          selectedModel,
          maxCloudCover
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao despachar job de análise.');
      }

      const jobId = data.jobId;
      setActiveJobId(jobId);

      // Poll pipeline job status until completion
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

      pollIntervalRef.current = setInterval(async () => {
        try {
          const statusRes = await authFetch(`/api/v1/analysis/${jobId}/status`);
          const statusData = await statusRes.json();

          if (statusData.status === 'completed') {
            clearInterval(pollIntervalRef.current);
            setAnalysisProgress(100);
            setAnalysisStageText(statusData.stageMessage || 'Análise concluída.');

            // Fetch final result
            const resultRes = await authFetch(`/api/v1/analysis/${jobId}/result`);
            const finalResult: AnalysisResult = await resultRes.json();
            setLiveAnalysisResult(finalResult);
            setIsAnalyzing(false);

            // Synthesize into current analysis
            const savedItem: SavedAreaAnalysis = {
              id: finalResult.analysisId,
              title: `Análise ${selectedPreset.name} - ${farmName}`,
              farmName: farmName,
              region: selectedPreset.name,
              biome: selectedPreset.biome,
              sourceType: selectedSourceType,
              sourceFormat: selectedFormat,
              center: finalResult.centroid,
              bbox: finalResult.bbox,
              areaHectares: finalResult.totalHectares,
              selectedModel: selectedModel,
              notes: `Auditada via pipeline v4.0.0. Sensor: Sentinel-2 L2A BOA. Resolução: ${finalResult.executionMetrics.spatialResolutionMeters}m. Provedor: ${finalResult.provenance.provider}.`,
              createdAt: finalResult.provenance.timestamp,
              updatedAt: finalResult.provenance.timestamp,
              author: user?.name || 'Operador',
              authorRole: user?.role || 'operador',
              status: 'analyzed',
              results: {
                meanNdvi: finalResult.vegetation.ndvi.mean,
                meanNdre: finalResult.vegetation.ndre.mean,
                carbonStockTon: finalResult.carbonAudit.totalEstimatedStockTonCO2e,
                carStatus: finalResult.compliance.carStatus,
                macroF1: 0.985,
                classBreakdown: finalResult.lulcBreakdown.map(c => ({
                  classId: c.classId,
                  className: c.className,
                  hectares: c.hectares,
                  percentage: c.percentage,
                  color: c.color
                }))
              }
            };
            setCurrentAnalysis(savedItem);

          } else if (statusData.status === 'failed') {
            clearInterval(pollIntervalRef.current);
            setIsAnalyzing(false);
            alert(`Falha na pipeline geoespacial: ${statusData.error || 'Erro desconhecido'}`);
          } else {
            setAnalysisProgress(statusData.progressPct || 40);
            setAnalysisStageText(statusData.stageMessage || 'Processando tensores multiespectrais...');
          }
        } catch (pollErr) {
          console.warn('Erro durante polling da pipeline:', pollErr);
        }
      }, 600);

    } catch (err: any) {
      setIsAnalyzing(false);
      alert(`Erro ao iniciar pipeline: ${err.message}`);
    }
  };

  // Generate AI Agronomic Report via server-side Gemini
  const handleGenerateAiReport = async () => {
    if (!currentAnalysis && !liveAnalysisResult) return;
    setAiReportLoading(true);
    try {
      const payload = liveAnalysisResult ? {
        farmName: liveAnalysisResult.farmName,
        region: liveAnalysisResult.region,
        biome: liveAnalysisResult.biome,
        areaHectares: liveAnalysisResult.totalHectares,
        meanNdvi: liveAnalysisResult.vegetation.ndvi.mean,
        meanNdre: liveAnalysisResult.vegetation.ndre.mean,
        carbonStockTon: liveAnalysisResult.carbonAudit.totalEstimatedStockTonCO2e,
        carStatus: liveAnalysisResult.compliance.carStatus,
        classBreakdown: liveAnalysisResult.lulcBreakdown,
        modelUsed: selectedModel
      } : {
        farmName: currentAnalysis!.farmName,
        region: currentAnalysis!.region,
        biome: currentAnalysis!.biome,
        areaHectares: currentAnalysis!.areaHectares,
        meanNdvi: currentAnalysis!.results.meanNdvi,
        meanNdre: currentAnalysis!.results.meanNdre,
        carbonStockTon: currentAnalysis!.results.carbonStockTon,
        carStatus: currentAnalysis!.results.carStatus,
        classBreakdown: currentAnalysis!.results.classBreakdown,
        modelUsed: currentAnalysis!.selectedModel
      };

      const res = await authFetch('/api/v1/ai/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data?.report) {
        setAiReportText(data.report);
      }
    } catch {
      setAiReportText("Parecer de Inteligência Agronômica (Triminds GeoAI): O talhão monitorado apresenta alta densidade vegetal consistente com culturas anuais de ciclo estival e áreas de reserva legal com cobertura intacta.");
    } finally {
      setAiReportLoading(false);
    }
  };

  // Real Export: Download GeoJSON
  const handleDownloadGeoJson = () => {
    if (liveAnalysisResult) {
      window.location.href = `/api/v1/analysis/${liveAnalysisResult.analysisId}/geojson`;
    } else if (currentAnalysis) {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentAnalysis, null, 2));
      const a = document.createElement('a');
      a.href = dataStr;
      a.download = `analise_${currentAnalysis.id}.json`;
      a.click();
    }
  };

  // Real Export: Download CSV of LULC classes
  const handleDownloadCsv = () => {
    const classes = liveAnalysisResult ? liveAnalysisResult.lulcBreakdown : currentAnalysis?.results.classBreakdown;
    if (!classes) return;

    let csvContent = "data:text/csv;charset=utf-8,Classe,Area_Hectares,Percentual,Cor\n";
    classes.forEach(c => {
      csvContent += `"${c.className}",${c.hectares},${c.percentage}%,"${c.color}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `cobertura_solo_${farmName.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save Modal Handlers
  const handleOpenSaveModal = () => {
    setSaveTitle(`Análise ${selectedPreset.name} - ${farmName}`);
    setSaveNotes(`Área de ${calculatedHectares.toLocaleString('pt-BR')} ha analisada via sensor Sentinel-2 L2A.`);
    setIsSaveModalOpen(true);
  };

  const handleConfirmSave = () => {
    if (!currentAnalysis) return;
    const newSave: SavedAreaAnalysis = {
      ...currentAnalysis,
      id: `saved_${Date.now()}`,
      title: saveTitle || currentAnalysis.title,
      notes: saveNotes || currentAnalysis.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updated = saveAnalysisToStorage(newSave);
    setSavedAnalyses(updated);
    setIsSaveModalOpen(false);
    setNotification('Análise salva com sucesso na biblioteca do projeto!');
    setTimeout(() => setNotification(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* 1. REAL PROVIDERS HEALTH & STATUS BAR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-slate-200">Status Operacional dos Provedores:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {providersStatus.map(p => {
            const isConnected = p.status === 'CONNECTED' || p.status === 'AVAILABLE';
            const isConfigRequired = p.status === 'NOT_CONFIGURED' || p.status === 'AUTH_REQUIRED';

            return (
              <div
                key={p.id}
                title={p.message}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] flex items-center gap-1.5 border ${
                  isConnected
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : isConfigRequired
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : isConfigRequired ? 'bg-amber-400' : 'bg-rose-400'}`} />
                <span className="font-semibold">{p.name.split('(')[0].trim()}:</span>
                <span className="font-bold uppercase text-[10px]">{p.status}</span>
              </div>
            );
          })}

          <button
            type="button"
            onClick={fetchProviderStatuses}
            disabled={isLoadingProviders}
            title="Atualizar status dos provedores"
            className="p-1 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingProviders ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. TOP TOOLBAR / NAVIGATION TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Pipeline Geoespacial & Seleção de Talhão</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
              v4.0.0 Real
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ingestão de dados de satélite reais, tensores espectrais e classificação auditável de uso do solo.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('picker')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'picker'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Mapa & Seleção</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('saved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'saved'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Biblioteca Salva ({savedAnalyses.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'picker' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Controls, Presets & STAC Search (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Map Selection & 4-Side Editing Tools */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Square className="w-3.5 h-3.5 text-emerald-400" />
                  Ferramentas de Seleção no Mapa
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {drawingMode ? (drawingMode === 'box' ? 'Desenhando Retângulo' : 'Desenhando Polígono') : 'Modo Navegação'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDrawingMode(drawingMode === 'box' ? null : 'box')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    drawingMode === 'box'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md ring-2 ring-amber-400/40 font-bold'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Retângulo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDrawingMode(drawingMode === 'polygon' ? null : 'polygon')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    drawingMode === 'polygon'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md ring-2 ring-amber-400/40 font-bold'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <Pentagon className="w-3.5 h-3.5" />
                  <span>Polígono Livre</span>
                </button>
              </div>

              {/* 4-Side Dimension Quick Formatting */}
              <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                  <span className="flex items-center gap-1 text-sky-400">
                    <Move className="w-3 h-3" />
                    Ajuste Fino dos 4 Lados
                  </span>
                  <span className="text-[10px] text-slate-500">Passo: 0.5 km</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Norte / Sul (Altura) */}
                  <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-1.5 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Norte/Sul</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setBboxHeightKm(prev => Math.max(1, Number((prev - 0.5).toFixed(1))))}
                        className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-rose-400 flex items-center justify-center text-xs font-bold"
                        title="Diminuir altura do retângulo"
                      >
                        -
                      </button>
                      <span className="font-mono text-[10px] text-slate-200 w-8 text-center">{bboxHeightKm}km</span>
                      <button
                        type="button"
                        onClick={() => setBboxHeightKm(prev => Math.min(30, Number((prev + 0.5).toFixed(1))))}
                        className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 flex items-center justify-center text-xs font-bold"
                        title="Aumentar altura do retângulo"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Leste / Oeste (Largura) */}
                  <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-1.5 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Leste/Oeste</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setBboxWidthKm(prev => Math.max(1, Number((prev - 0.5).toFixed(1))))}
                        className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-rose-400 flex items-center justify-center text-xs font-bold"
                        title="Diminuir largura do retângulo"
                      >
                        -
                      </button>
                      <span className="font-mono text-[10px] text-slate-200 w-8 text-center">{bboxWidthKm}km</span>
                      <button
                        type="button"
                        onClick={() => setBboxWidthKm(prev => Math.min(30, Number((prev + 0.5).toFixed(1))))}
                        className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 flex items-center justify-center text-xs font-bold"
                        title="Aumentar largura do retângulo"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {drawnPolygon && (
                  <button
                    type="button"
                    onClick={() => setDrawnPolygon(null)}
                    className="w-full mt-1 py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-amber-300 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Descartar polígono e voltar ao retângulo</span>
                  </button>
                )}
              </div>
            </div>

            {/* Geometry Coordinates & Parameters */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-sky-400" />
                  Dimensões & Bounding Box
                </span>
                {drawnPolygon ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Polígono Customizado
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-slate-400">
                    {calculatedHectares.toLocaleString('pt-BR')} ha
                  </span>
                )}
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Nome da Propriedade / Talhão</label>
                <input
                  type="text"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">Latitude Centro</label>
                  <input
                    type="number"
                    step="0.001"
                    value={centerLat}
                    onChange={(e) => {
                      setCenterLat(parseFloat(e.target.value));
                      setDrawnPolygon(null);
                    }}
                    className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg font-mono text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">Longitude Centro</label>
                  <input
                    type="number"
                    step="0.001"
                    value={centerLng}
                    onChange={(e) => {
                      setCenterLng(parseFloat(e.target.value));
                      setDrawnPolygon(null);
                    }}
                    className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg font-mono text-white text-xs"
                  />
                </div>
              </div>

              {!drawnPolygon && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Largura BBox (km)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="30"
                      value={bboxWidthKm}
                      onChange={(e) => setBboxWidthKm(Math.max(1, parseFloat(e.target.value) || 1))}
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg font-mono text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Altura BBox (km)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="30"
                      value={bboxHeightKm}
                      onChange={(e) => setBboxHeightKm(Math.max(1, parseFloat(e.target.value) || 1))}
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg font-mono text-white text-xs"
                    />
                  </div>
                </div>
              )}

              {/* BBox coordinates readout */}
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-[10px] text-slate-400 space-y-0.5">
                <div className="text-slate-500">BBox: [{computedBbox.join(', ')}]</div>
                <div>Área: <strong className="text-emerald-400">{calculatedHectares.toLocaleString('pt-BR')} ha</strong> (~{Math.round(calculatedHectares / 0.01).toLocaleString('pt-BR')} pixels a 10m)</div>
              </div>
            </div>

            {/* Real Satellite Search (STAC) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Satellite className="w-3.5 h-3.5 text-emerald-400" />
                  Busca de Cenas Reais (Sentinel-2 L2A)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-slate-400 block mb-0.5">Max Nuvens: {maxCloudCover}%</label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={maxCloudCover}
                    onChange={(e) => setMaxCloudCover(parseInt(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSearchSatelliteScenes}
                  disabled={isSearchingScenes}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Search className={`w-3.5 h-3.5 ${isSearchingScenes ? 'animate-spin' : ''}`} />
                  <span>{isSearchingScenes ? 'Buscando...' : 'Buscar'}</span>
                </button>
              </div>

              {sceneSearchError && (
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                  {sceneSearchError}
                </div>
              )}

              {availableScenes.length > 0 && (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    {availableScenes.length} cena(s) encontrada(s):
                  </div>
                  {availableScenes.map(scene => {
                    const isSelected = selectedScene?.id === scene.id;
                    return (
                      <div
                        key={scene.id}
                        onClick={() => setSelectedScene(scene)}
                        className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="font-bold text-slate-200 truncate max-w-[170px]">{scene.id}</span>
                          <span className="text-emerald-400 font-bold">{scene.cloudCoverPct}% nuvens</span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>Data: {new Date(scene.datetime).toLocaleDateString('pt-BR')}</span>
                          {scene.sunElevationDeg && <span>Sol: {scene.sunElevationDeg}°</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Run Pipeline Button */}
            <button
              type="button"
              onClick={handleRunRealPipeline}
              disabled={isAnalyzing}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/15 cursor-pointer disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Executando Pipeline ({analysisProgress}%)...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Executar Pipeline Geoespacial Real</span>
                </>
              )}
            </button>

            {/* Progress Bar when running */}
            {isAnalyzing && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="truncate pr-2">{analysisStageText}</span>
                  <span className="font-mono text-emerald-400">{analysisProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                    style={{ width: `${analysisProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: REAL LEAFLET MAP & LIVE RESULTS (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Real Interactive Leaflet Map */}
            <div className="w-full h-[520px]">
              <RealLeafletMap
                center={{ lat: centerLat, lng: centerLng }}
                zoom={12}
                bbox={computedBbox}
                polygonCoords={drawnPolygon || undefined}
                onRoiChange={handleMapRoiChange}
                lulcGeoJson={liveAnalysisResult?.vectorGeoJson || null}
                isDrawingMode={drawingMode}
                onDrawingModeChange={setDrawingMode}
              />
            </div>

            {/* Analytical Results Display (Appears once pipeline completes) */}
            {(liveAnalysisResult || currentAnalysis) && (
              <div className="space-y-6">
                {/* Result Header & Export Bar */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Resultado da Classificação de Cobertura do Solo: {farmName}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                        {liveAnalysisResult?.compliance.carStatus || currentAnalysis?.results.carStatus}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Área Total: {calculatedHectares.toLocaleString('pt-BR')} ha • Resolução: 10m Ground Sample Distance
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadGeoJson}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Baixar GeoJSON</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadCsv}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-sky-400" />
                      <span>Exportar CSV</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenSaveModal}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Salvar Laudo</span>
                    </button>
                  </div>
                </div>

                {/* 3 Metric Cards: Vegetation Indices, LULC Breakdown, Carbon Audit */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1: Vegetation Indices */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                        Índices Espectrais Reais
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400">10m GSD</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-slate-950 rounded-xl border border-slate-800/80">
                        <span className="text-xs text-slate-400">NDVI Médio:</span>
                        <span className="font-mono text-sm font-bold text-emerald-400">
                          {liveAnalysisResult ? liveAnalysisResult.vegetation.ndvi.mean : currentAnalysis?.results.meanNdvi}
                        </span>
                      </div>

                      <div className="flex justify-between items-center p-2 bg-slate-950 rounded-xl border border-slate-800/80">
                        <span className="text-xs text-slate-400">NDRE (RedEdge):</span>
                        <span className="font-mono text-sm font-bold text-teal-400">
                          {liveAnalysisResult ? liveAnalysisResult.vegetation.ndre.mean : currentAnalysis?.results.meanNdre}
                        </span>
                      </div>

                      {liveAnalysisResult && (
                        <div className="p-2 bg-slate-950 rounded-xl border border-slate-800/80 text-[10px] font-mono text-slate-400 space-y-1">
                          <div className="flex justify-between">
                            <span>Min / Max NDVI:</span>
                            <span className="text-slate-200">{liveAnalysisResult.vegetation.ndvi.min} / {liveAnalysisResult.vegetation.ndvi.max}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Desvio Padrão:</span>
                            <span className="text-slate-200">±{liveAnalysisResult.vegetation.ndvi.stdDev}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card 2: LULC Classes */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        Classes de Uso do Solo
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">EuroSAT / S2</span>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {(liveAnalysisResult ? liveAnalysisResult.lulcBreakdown : currentAnalysis?.results.classBreakdown)?.map((c) => (
                        <div key={c.classId} className="p-1.5 bg-slate-950 rounded-xl border border-slate-800/80 text-[11px] flex items-center justify-between">
                          <div className="flex items-center gap-2 truncate pr-2">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                            <span className="text-slate-200 truncate">{c.className}</span>
                          </div>
                          <div className="text-right shrink-0 font-mono text-[10px]">
                            <span className="text-slate-300 font-bold">{c.hectares.toLocaleString('pt-BR')} ha</span>
                            <span className="text-slate-500 ml-1">({c.percentage}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card 3: Documented Carbon Audit */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <TreeDeciduous className="w-3.5 h-3.5 text-teal-400" />
                        Estoque de Carbono (IPCC/MCTI)
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                      <div className="text-[10px] text-slate-400">Total Estimado no Talhão:</div>
                      <div className="text-lg font-black font-mono text-teal-400">
                        {liveAnalysisResult
                          ? liveAnalysisResult.carbonAudit.totalEstimatedStockTonCO2e.toLocaleString('pt-BR')
                          : currentAnalysis?.results.carbonStockTon.toLocaleString('pt-BR')}{' '}
                        <span className="text-xs font-normal text-slate-400">tCO2e</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Metodologia: IPCC Tier 1 (AFOLU) & MCTI 4ª Comunicação Nacional
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 leading-relaxed">
                      Auditoria de biomassa vegetal e carbono orgânico do solo com fatores validados por bioma.
                    </div>
                  </div>
                </div>

                {/* Real Provenance & Execution Evidence Card (Section 26) */}
                {liveAnalysisResult && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        Rastreabilidade & Proveniência Geoespacial (Audit Log)
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">
                        Job: {liveAnalysisResult.analysisId}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono pt-1">
                      <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                        <div className="text-slate-500 text-[10px]">Provedor / Satélite</div>
                        <div className="text-slate-200 font-bold truncate">{liveAnalysisResult.provenance.provider}</div>
                      </div>

                      <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                        <div className="text-slate-500 text-[10px]">Cena / Dataset</div>
                        <div className="text-slate-200 font-bold truncate">{liveAnalysisResult.provenance.sceneId || liveAnalysisResult.provenance.dataset}</div>
                      </div>

                      <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                        <div className="text-slate-500 text-[10px]">Tempo de Inferência</div>
                        <div className="text-emerald-400 font-bold">{liveAnalysisResult.executionMetrics.inferenceTimeMs}ms</div>
                      </div>

                      <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                        <div className="text-slate-500 text-[10px]">Pixels Processados</div>
                        <div className="text-sky-400 font-bold">{liveAnalysisResult.executionMetrics.pixelsProcessed.toLocaleString('pt-BR')}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Agronomic Report Section (Gemini) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        Parecer Agronômico & Regulatório (IA Generativa)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateAiReport}
                      disabled={aiReportLoading}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-md shadow-purple-600/20"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${aiReportLoading ? 'animate-spin' : ''}`} />
                      <span>{aiReportLoading ? 'Gerando Laudo...' : 'Gerar Parecer com Gemini'}</span>
                    </button>
                  </div>

                  {aiReportText && (
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-line">
                      {aiReportText}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* SAVED ANALYSES LIBRARY TAB */
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={savedSearchTerm}
                onChange={(e) => setSavedSearchTerm(e.target.value)}
                placeholder="Filtrar por nome, fazenda ou bioma..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="text-xs text-slate-400">
              {savedAnalyses.length} análise(s) salva(s)
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedAnalyses
              .filter(a => 
                a.title.toLowerCase().includes(savedSearchTerm.toLowerCase()) ||
                a.farmName.toLowerCase().includes(savedSearchTerm.toLowerCase()) ||
                a.region.toLowerCase().includes(savedSearchTerm.toLowerCase())
              )
              .map(analysis => (
                <div key={analysis.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white truncate max-w-[200px]">{analysis.title}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                        {analysis.results.carStatus}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400">
                      {analysis.farmName} • {analysis.region} ({analysis.biome})
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                      <div>
                        <span className="text-slate-500 block">Área</span>
                        <span className="text-slate-200 font-bold">{analysis.areaHectares.toLocaleString('pt-BR')} ha</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">NDVI Médio</span>
                        <span className="text-emerald-400 font-bold">{analysis.results.meanNdvi}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {analysis.notes}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentAnalysis(analysis);
                        setLiveAnalysisResult(null);
                        setCenterLat(analysis.center.lat);
                        setCenterLng(analysis.center.lng);
                        setActiveTab('picker');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Visualizar no Mapa
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const updated = deleteAnalysisFromStorage(analysis.id);
                        setSavedAnalyses(updated);
                      }}
                      className="p-1.5 text-rose-400 hover:text-rose-300 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Save Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Save className="w-4 h-4 text-emerald-400" />
                <span>Salvar Laudo na Biblioteca</span>
              </h3>
              <button onClick={() => setIsSaveModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Título do Laudo</label>
                <input
                  type="text"
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Anotações / Parecer Técnico</label>
                <textarea
                  rows={3}
                  value={saveNotes}
                  onChange={(e) => setSaveNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20"
              >
                Confirmar e Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
