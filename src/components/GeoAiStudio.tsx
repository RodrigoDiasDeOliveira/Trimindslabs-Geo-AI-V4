import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { 
  GEO_SAMPLES, 
  DEEP_LEARNING_MODELS, 
  GeoSample, 
} from '../data/geoData';
import { 
  PRESET_REGIONS, 
  PresetRegion 
} from '../data/mapSourcesData';
import { getSavedAnalyses } from '../utils/analysisStorage';
import { SavedAreaAnalysis } from '../types';
import { 
  Play, 
  Cpu, 
  Layers, 
  Upload, 
  Sliders, 
  BarChart3, 
  Sparkles, 
  Eye, 
  MapPin, 
  FileCheck, 
  Info,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Search,
  Compass,
  Plus,
  Trash2,
  Bookmark,
  FileText,
  X,
  Database,
  RefreshCw,
  FolderOpen
} from 'lucide-react';

interface GeoAiStudioProps {
  onOpenMapSelector?: () => void;
}

const PRESET_STORAGE_KEY = 'triminds_custom_preset_regions_v1';

export const GeoAiStudio: React.FC<GeoAiStudioProps> = ({ onOpenMapSelector }) => {
  const { language, t } = useLanguage();

  // Source selection modes: 'samples' | 'presets' | 'saved_library'
  const [sourceMode, setSourceMode] = useState<'samples' | 'presets' | 'saved_library'>('samples');

  // Pre-configured regions state (with add & delete, persisted in localStorage)
  const [presetList, setPresetList] = useState<PresetRegion[]>(() => {
    try {
      const saved = localStorage.getItem(PRESET_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load presets from storage', e);
    }
    return PRESET_REGIONS;
  });

  const [selectedPreset, setSelectedPreset] = useState<PresetRegion>(presetList[0]);
  const [isAddPresetModalOpen, setIsAddPresetModalOpen] = useState<boolean>(false);
  const [newPresetForm, setNewPresetForm] = useState<{
    name: string;
    farm: string;
    state: string;
    biome: string;
    lat: number;
    lng: number;
    hectares: number;
    description: string;
  }>({
    name: '',
    farm: '',
    state: 'MT',
    biome: 'Cerrado',
    lat: -12.50,
    lng: -55.70,
    hectares: 5000,
    description: ''
  });

  // Saved analyses library state
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAreaAnalysis[]>([]);
  const [selectedSavedAnalysis, setSelectedSavedAnalysis] = useState<SavedAreaAnalysis | null>(null);

  // Load saved analyses when switching to saved_library
  useEffect(() => {
    if (sourceMode === 'saved_library') {
      const list = getSavedAnalyses();
      setSavedAnalyses(list);
      if (list.length > 0 && !selectedSavedAnalysis) {
        setSelectedSavedAnalysis(list[0]);
      }
    }
  }, [sourceMode]);

  // Save presets to localStorage when modified
  const savePresets = (newList: PresetRegion[]) => {
    setPresetList(newList);
    try {
      localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {
      console.error('Failed to save presets to storage', e);
    }
  };

  const handleAddPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetForm.name || !newPresetForm.farm) return;

    const newRegion: PresetRegion = {
      id: `custom_preset_${Date.now()}`,
      name: newPresetForm.name,
      farm: newPresetForm.farm,
      state: newPresetForm.state,
      biome: newPresetForm.biome,
      center: { lat: newPresetForm.lat, lng: newPresetForm.lng },
      bbox: [
        Number((newPresetForm.lng - 0.05).toFixed(4)),
        Number((newPresetForm.lat - 0.04).toFixed(4)),
        Number((newPresetForm.lng + 0.05).toFixed(4)),
        Number((newPresetForm.lat + 0.04).toFixed(4))
      ],
      defaultHectares: newPresetForm.hectares,
      previewUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
      description: newPresetForm.description || `Talhão agrícola sob monitoramento na região de ${newPresetForm.name}.`
    };

    const updated = [newRegion, ...presetList];
    savePresets(updated);
    setSelectedPreset(newRegion);
    setIsAddPresetModalOpen(false);
    setNewPresetForm({
      name: '',
      farm: '',
      state: 'MT',
      biome: 'Cerrado',
      lat: -12.50,
      lng: -55.70,
      hectares: 5000,
      description: ''
    });
    setUploadFeedback(`Região "${newRegion.name}" adicionada com sucesso!`);
    setTimeout(() => setUploadFeedback(null), 4000);
  };

  const handleDeletePreset = (id: string, name: string) => {
    if (presetList.length <= 1) {
      alert('É necessário manter pelo menos uma região pré-configurada.');
      return;
    }
    const filtered = presetList.filter(p => p.id !== id);
    savePresets(filtered);
    if (selectedPreset.id === id) {
      setSelectedPreset(filtered[0]);
    }
    setUploadFeedback(`Região "${name}" excluída.`);
    setTimeout(() => setUploadFeedback(null), 3500);
  };

  // Main studio state
  const [selectedSample, setSelectedSample] = useState<GeoSample>(GEO_SAMPLES[0]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedModelId, setSelectedModelId] = useState<string>('resnet50');
  const [adapterEnabled, setAdapterEnabled] = useState<boolean>(true);
  const [spectralTab, setSpectralTab] = useState<'rgb' | 'nir' | 'ndvi' | 'ndre' | 'embedding'>('rgb');
  const [customFile, setCustomFile] = useState<{ 
    name: string; 
    size: string; 
    channels: number;
    format: string;
  } | null>(null);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);

  const selectedModel = DEEP_LEARNING_MODELS.find(m => m.id === selectedModelId) || DEEP_LEARNING_MODELS[0];

  const handleOpenRealAnalysis = () => {
    if (customFile) {
      setUploadFeedback('O arquivo está disponível apenas para visualização nesta tela; nenhum processamento raster ou inferência foi executado. Use a análise geoespacial com cena Sentinel-2 ou implemente o processamento de upload antes de avaliar este arquivo.');
      return;
    }
    if (onOpenMapSelector) {
      onOpenMapSelector();
      return;
    }
    setUploadFeedback('A pipeline geoespacial real não está conectada a este painel. Nenhuma inferência foi executada.');
  };

  // Uploads are preview-only in this panel until a real raster inference endpoint exists.
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    let formatLabel = 'Arquivo não processado';
    let channels = 0;
    const isImage = file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp'].includes(ext);

    if (['tif', 'tiff', 'geotiff', 'cog'].includes(ext)) {
      formatLabel = 'GeoTIFF multiespectral (não processado)';
      channels = 0;
    } else if (['npy', 'tensor', 'pt', 'bin'].includes(ext)) {
      formatLabel = 'Tensor/embedding (não processado)';
      channels = 0;
    } else if (isImage) {
      formatLabel = `Imagem para visualização (${ext.toUpperCase()})`;
      channels = 3;
    } else {
      setUploadFeedback('Formato não suportado para visualização. Nenhuma análise foi executada.');
      e.target.value = '';
      return;
    }

    setCustomFile({
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      channels,
      format: formatLabel
    });

    if (isImage) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const resultUrl = event.target?.result as string;
        setUploadedPreviewUrl(resultUrl);
        setSelectedSample({
          ...GEO_SAMPLES[0],
          id: `upload-preview-${Date.now()}`,
          name: {
            'pt-BR': `Visualização: ${file.name}`,
            en: `Preview: ${file.name}`,
            es: `Vista previa: ${file.name}`
          },
          previewUrl: resultUrl,
          channels
        });
        setUploadFeedback(`Arquivo "${file.name}" carregado para visualização. Nenhuma inferência ou classificação foi executada.`);
      };
      reader.onerror = () => {
        setUploadedPreviewUrl(null);
        setUploadFeedback('Não foi possível ler a imagem para visualização.');
      };
      reader.readAsDataURL(file);
    } else {
      setUploadedPreviewUrl(null);
      setSelectedSample({
        ...GEO_SAMPLES[0],
        id: `upload-metadata-${Date.now()}`,
        name: {
          'pt-BR': `Arquivo não processado: ${file.name}`,
          en: `Unprocessed file: ${file.name}`,
          es: `Archivo no procesado: ${file.name}`
        },
        previewUrl: '',
        channels: 0
      });
      setUploadFeedback(`Arquivo "${file.name}" recebido apenas como metadado. Este painel não processa GeoTIFF/tensores e não produziu resultado.`);
    }
  };


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Layers className="w-6 h-6" />
            </span>
            {t.studio.title}
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-1 max-w-3xl">
            {t.studio.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {sourceMode === 'saved_library' && (
            <button
              type="button"
              onClick={handleOpenRealAnalysis}
              disabled={isProcessing}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-sky-950 bg-sky-400 hover:bg-sky-300 transition-all shadow-md shadow-sky-500/20 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>Abrir análise geoespacial</span>
            </button>
          )}

          <button
            id="btn-run-inference-main"
            type="button"
            onClick={handleOpenRealAnalysis}
            className="inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-sm text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Abrir análise geoespacial real</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {uploadFeedback && (
        <div className="bg-amber-500/10 border border-amber-500/40 text-amber-200 px-4 py-3 rounded-xl text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
            <span>{uploadFeedback}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setUploadFeedback(null)} 
            className="text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Selection & Model Configuration */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Input Source Selection */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                {t.studio.inputSourceTitle}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {customFile ? customFile.format : (selectedSample.sensor === 'GoogleSatelliteEmbedding' ? '64-Bands Embedding' : 'Multispectral')}
              </span>
            </div>

            {/* Source Mode Switcher Bar */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs">
              {/* Note: When in 'saved_library', the user can toggle back to 'samples'. 'presets' only appears outside of 'saved_library' */}
              <button
                type="button"
                onClick={() => setSourceMode('samples')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition-all cursor-pointer text-center ${
                  sourceMode === 'samples' 
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Amostras Satelitais
              </button>

              {sourceMode !== 'saved_library' ? (
                <button
                  type="button"
                  onClick={() => setSourceMode('presets')}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition-all cursor-pointer text-center ${
                    sourceMode === 'presets' 
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Regiões Pré-configuradas
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => setSourceMode('saved_library')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                  sourceMode === 'saved_library' 
                    ? 'bg-sky-500 text-slate-950 font-bold shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bookmark className="w-3 h-3" />
                <span>Biblioteca Salva</span>
              </button>
            </div>

            {/* CASE 1: PRE-CONFIGURED REGIONS (Shows only when sourceMode === 'presets') */}
            {sourceMode === 'presets' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    Regiões Cadastradas ({presetList.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddPresetModalOpen(true)}
                    className="py-1 px-2.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Região</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                  {presetList.map((preset) => {
                    const isSelected = selectedPreset.id === preset.id;
                    return (
                      <div
                        key={preset.id}
                        className={`p-2.5 rounded-xl border transition-all flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm'
                            : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPreset(preset);
                            setSelectedSample({
                              ...GEO_SAMPLES[0],
                              id: preset.id,
                              name: {
                                'pt-BR': `${preset.name} - ${preset.farm}`,
                                en: `${preset.name} - ${preset.farm}`,
                                es: `${preset.name} - ${preset.farm}`
                              },
                              region: `${preset.state} • ${preset.biome}`,
                              previewUrl: preset.previewUrl
                            });

                          }}
                          className="flex-1 text-left cursor-pointer"
                        >
                          <div className="text-xs font-bold text-slate-200">{preset.name}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {preset.farm} • {preset.state} • {preset.defaultHectares.toLocaleString('pt-BR')} ha
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{preset.biome}</div>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePreset(preset.id, preset.name);
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer rounded"
                          title="Excluir região pré-configurada"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CASE 2: SAVED LIBRARY (When clicked, pre-configured regions option is hidden) */}
            {sourceMode === 'saved_library' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-sky-400 flex items-center gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5" />
                    Análises Salvas na Biblioteca ({savedAnalyses.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = getSavedAnalyses();
                      setSavedAnalyses(updated);
                    }}
                    className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                    title="Recarregar análises salvas"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {savedAnalyses.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
                    Nenhuma análise salva encontrada. Crie e salve análises no menu &quot;Escolher no Mapa&quot;.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                    {savedAnalyses.map((item) => {
                      const isSelected = selectedSavedAnalysis?.id === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSelectedSavedAnalysis(item);
                            setSelectedSample({
                              ...GEO_SAMPLES[0],
                              id: item.id,
                              name: {
                                'pt-BR': item.title,
                                en: item.title,
                                es: item.title
                              },
                              region: `${item.region} • ${item.farmName}`,
                              defaultClassId: item.results.classBreakdown[0]?.classId === 'ac' ? 'AnnualCrop' : 'Forest'
                            });

                          }}
                          className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-sky-500/10 border-sky-500/40 shadow-sm ring-1 ring-sky-500/30'
                              : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-200">{item.title}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-sky-300">
                              {item.areaHectares.toLocaleString('pt-BR')} ha
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                            <span>{item.farmName} • {item.region}</span>
                            <span className="text-[10px] font-mono text-emerald-400">{item.results.carStatus}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* CASE 3: SAMPLES (Default S2 Biome Datasets) */}
            {sourceMode === 'samples' && (
              <div className="space-y-2">
                {onOpenMapSelector && (
                  <button
                    id="btn-studio-pick-map"
                    type="button"
                    onClick={onOpenMapSelector}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-sky-500/20 hover:from-emerald-500 hover:to-teal-400 text-emerald-300 hover:text-slate-950 border border-emerald-500/30 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer group"
                  >
                    <Compass className="w-4 h-4 text-emerald-400 group-hover:text-slate-950 transition-colors" />
                    <span>Escolher Região no Mapa (Google Earth Engine & Maps)</span>
                  </button>
                )}

                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-400">
                    {t.studio.selectBiomeSample}
                  </label>
                  <span className="text-[10px] text-emerald-400 font-mono font-medium">
                    {GEO_SAMPLES.filter(s => s.name[language].toLowerCase().includes(searchTerm.toLowerCase()) || s.region.toLowerCase().includes(searchTerm.toLowerCase())).length} disponíveis
                  </span>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <input
                    id="input-search-images"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar imagens de satélite por bioma ou talhão..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                  {GEO_SAMPLES.filter(s => 
                    s.name[language].toLowerCase().includes(searchTerm.toLowerCase()) ||
                    s.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    s.biome[language].toLowerCase().includes(searchTerm.toLowerCase())
                  ).map(sample => {
                    const isSelected = selectedSample.id === sample.id && !customFile;
                    return (
                      <button
                        key={sample.id}
                        id={`sample-select-${sample.id}`}
                        onClick={() => {
                          setSelectedSample(sample);
                          setCustomFile(null);
                          setUploadedPreviewUrl(null);
                        }}
                        className={`text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm'
                            : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-slate-200">
                            {sample.name[language]}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span>{sample.region}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-300 shrink-0">
                          {sample.channels} CH
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ENHANCED FILE UPLOAD: Supports JPG, GeoTIFF, Tensor, NPY, PNG */}
            <div className="border border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl p-4 text-center transition-colors bg-slate-950/40 space-y-2">
              <input
                type="file"
                id="file-upload-input"
                accept=".jpg,.jpeg,.png,.webp,.tif,.tiff,.geotiff,.cog,.npy,.tensor,.pt,.bin"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label htmlFor="file-upload-input" className="cursor-pointer block space-y-2">
                <Upload className="w-6 h-6 text-emerald-400 mx-auto" />
                <p className="text-xs text-slate-300 font-semibold">
                  Subir Imagem Satelital, GeoTIFF ou Tensor
                </p>
                <p className="text-[11px] text-slate-500">
                  Formatos aceitos: <strong>JPG, PNG, GeoTIFF (.tif), Tensor (.npy, .pt, .tensor)</strong>
                </p>
              </label>

              {customFile && (
                <div className="mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
                  <div className="truncate text-left max-w-[220px]">
                    <div className="font-bold truncate">{customFile.name}</div>
                    <div className="text-[10px] text-slate-400">{customFile.format} • {customFile.channels} canais</div>
                  </div>
                  <span className="font-mono text-[10px] bg-slate-900 px-2 py-0.5 rounded text-emerald-400">
                    {customFile.size}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 2. Deep Learning Model Configuration */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              {t.studio.modelSectionTitle}
            </h2>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400">
                {t.studio.selectModel}
              </label>
              <div className="space-y-2">
                {DEEP_LEARNING_MODELS.map(model => {
                  const isSelected = selectedModelId === model.id;
                  return (
                    <button
                      key={model.id}
                      id={`model-select-${model.id}`}
                      onClick={() => {
                        const accepted = window.confirm(
                          `${model.name}: esta seleção altera apenas a configuração visual. A pipeline atual executa um classificador espectral baseado em regras, não os pesos de uma CNN/Transformer. Requisitos, adaptadores e métricas de catálogo não comprovam inferência real. Deseja selecionar este modelo solicitado?`
                        );
                        if (accepted) {
                          setSelectedModelId(model.id);
                        }
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-sky-500/10 border-sky-500/40 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">{model.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 font-mono">
                          {model.parameters}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                        <span>Família: {model.family}</span>
                        <span>{model.supports64Bands ? 'Entrada 64 bandas' : 'Entrada limitada'}</span>
                        <span>{model.adapterRequired ? 'Adaptador exigido' : 'Adaptador opcional'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Embedding Adapter Fix Toggle */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  EmbeddingAdapter (64-Channels)
                </span>
                <button
                  id="toggle-adapter-btn"
                  onClick={() => setAdapterEnabled(!adapterEnabled)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    adapterEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      adapterEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Esta opção é apenas visual nesta versão: nenhum adaptador é carregado ou executado pela pipeline atual.
              </p>
              <div className="text-[11px] text-slate-500 bg-slate-900/80 p-2 rounded border border-slate-800 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                <span>{selectedModel.adapterInfo[language]}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Spectral Visualizer & Inference Output */}
        <div className="lg:col-span-7 space-y-6">
          {/* 3. Spectral Analysis & Vegetation Indices */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                {t.studio.spectralViewTitle}
              </h2>

              {/* Spectral Tabs */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  id="tab-spectral-rgb"
                  onClick={() => setSpectralTab('rgb')}
                  className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
                    spectralTab === 'rgb' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.studio.tabRgb}
                </button>
                <button
                  id="tab-spectral-nir"
                  onClick={() => setSpectralTab('nir')}
                  className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
                    spectralTab === 'nir' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.studio.tabNir}
                </button>
                <button
                  id="tab-spectral-ndvi"
                  onClick={() => setSpectralTab('ndvi')}
                  className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
                    spectralTab === 'ndvi' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.studio.tabNdvi}
                </button>
                <button
                  id="tab-spectral-embedding"
                  onClick={() => setSpectralTab('embedding')}
                  className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
                    spectralTab === 'embedding' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.studio.tabEmbedding}
                </button>
              </div>
            </div>

            {/* Satellite / Uploaded Viewport Area */}
            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center group">
              {spectralTab === 'embedding' && customFile ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center gap-2 text-amber-200">
                  <AlertTriangle className="w-6 h-6" />
                  <strong className="text-sm">Tensor não processado</strong>
                  <span className="text-xs">Os valores de bandas demonstrados pertencem à amostra, não ao arquivo enviado. Nenhum tensor foi decodificado ou classificado.</span>
                </div>
              ) : spectralTab === 'embedding' ? (
                /* 64-Band Embedding Profile Visualization */
                <div className="w-full h-full p-4 flex flex-col justify-between bg-slate-950">
                  <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                    <span className="font-mono text-sky-400">
                      {customFile ? `${customFile.format} (64 Canais)` : 'GoogleSatelliteEmbedding_v1 Tensor (64, 64, 64)'}
                    </span>
                    <span className="text-[11px] text-emerald-400">Espaço Vetorial Latente [-1.0 a +1.0]</span>
                  </div>
                  {/* Vector Bar Spectrum */}
                  <div className="grid grid-cols-16 gap-1 h-32 items-end py-2">
                    {selectedSample.simulatedBands.embeddingVectorSample.map((val, idx) => {
                      const heightPct = Math.abs(val) * 100;
                      const isPositive = val >= 0;
                      return (
                        <div key={idx} className="h-full flex flex-col justify-center items-center group/bar relative">
                          <div
                            style={{ height: `${heightPct}%` }}
                            className={`w-full rounded-t transition-all ${
                              isPositive ? 'bg-emerald-400' : 'bg-sky-500'
                            }`}
                          ></div>
                          <div className="text-[8px] font-mono text-slate-500 mt-1">{idx + 1}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>NDVI: <strong className="text-emerald-300">{selectedSample.simulatedBands.ndvi}</strong></span>
                    <span>NDRE: <strong className="text-emerald-300">{selectedSample.simulatedBands.ndre}</strong></span>
                    <span>Refletância NIR: <strong className="text-sky-300">{(selectedSample.simulatedBands.nir * 100).toFixed(0)}%</strong></span>
                  </div>
                </div>
              ) : (
                /* Image View with Simulated Filter overlays */
                <div className="w-full h-full relative">
                  {(uploadedPreviewUrl || (!customFile && selectedSample.previewUrl)) ? (
                    <img
                      src={uploadedPreviewUrl || selectedSample.previewUrl}
                      alt={selectedSample.name[language]}
                      className={`w-full h-full object-cover transition-all duration-300 ${
                        customFile ? '' :
                        spectralTab === 'nir' ? 'contrast-125 saturate-200 hue-rotate-90' :
                        spectralTab === 'ndvi' ? 'grayscale contrast-150 invert sepia hue-rotate-60' : ''
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-6 text-center text-xs text-amber-200">
                      Pré-visualização indisponível para este formato. O arquivo não foi processado.
                    </div>
                  )}
                  {/* Overlay badge with sample info */}
                  <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-sm border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs text-white">
                    <span className="font-semibold">
                      {customFile ? customFile.name : selectedSample.region}
                    </span>
                    <span className="text-slate-400 text-[11px] block">
                      {customFile ? customFile.format : selectedSample.biome[language]}
                    </span>
                  </div>

                  {!customFile && (
                    <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-sm border border-slate-700/60 rounded-lg px-3 py-1 text-[11px] font-mono text-emerald-400">
                      BBox da amostra: [{selectedSample.coordinates.bbox.join(', ')}]
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Results are not fabricated: this panel does not execute the selected DL model. */}
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center gap-2 text-amber-300">
              <AlertTriangle className="w-4 h-4" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Inferência real não executada neste painel</h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              As antigas probabilidades e o rótulo de classe eram derivados de dados de amostra, não dos pixels enviados. Para evitar resultados fictícios, eles foram removidos. A seleção de modelo aqui é apenas uma solicitação de configuração; a pipeline disponível usa classificação espectral baseada em regras.
            </p>
            {customFile && (
              <p className="text-xs text-amber-200">
                Arquivo selecionado: {customFile.name}. O upload atual não envia nem processa os pixels no backend; a imagem pode ser visualizada, mas não deve ser interpretada como analisada.
              </p>
            )}
            <button
              type="button"
              onClick={handleOpenRealAnalysis}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold"
            >
              Abrir pipeline geoespacial disponível
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Adicionar Região Pré-configurada */}
      {isAddPresetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Adicionar Região Pré-configurada</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddPresetModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPreset} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Nome da Região / Município</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Primavera do Leste (MT)"
                  value={newPresetForm.name}
                  onChange={(e) => setNewPresetForm({ ...newPresetForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Fazenda / Talhão</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Fazenda Alvorada"
                    value={newPresetForm.farm}
                    onChange={(e) => setNewPresetForm({ ...newPresetForm, farm: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Estado (UF)</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    placeholder="MT"
                    value={newPresetForm.state}
                    onChange={(e) => setNewPresetForm({ ...newPresetForm, state: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Bioma</label>
                  <select
                    value={newPresetForm.biome}
                    onChange={(e) => setNewPresetForm({ ...newPresetForm, biome: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Cerrado">Cerrado</option>
                    <option value="Amazônia">Amazônia</option>
                    <option value="Mata Atlântica">Mata Atlântica</option>
                    <option value="Caatinga">Caatinga</option>
                    <option value="Pampa">Pampa</option>
                    <option value="Pantanal">Pantanal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Área Aproximada (ha)</label>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={newPresetForm.hectares}
                    onChange={(e) => setNewPresetForm({ ...newPresetForm, hectares: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Latitude Centro (WGS84)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={newPresetForm.lat}
                    onChange={(e) => setNewPresetForm({ ...newPresetForm, lat: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Longitude Centro (WGS84)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={newPresetForm.lng}
                    onChange={(e) => setNewPresetForm({ ...newPresetForm, lng: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Descrição / Finalidade</label>
                <textarea
                  rows={2}
                  placeholder="Monitoramento de safra e conformidade ambiental..."
                  value={newPresetForm.description}
                  onChange={(e) => setNewPresetForm({ ...newPresetForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddPresetModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-slate-950 bg-emerald-400 hover:bg-emerald-300 font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  Salvar Região
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
