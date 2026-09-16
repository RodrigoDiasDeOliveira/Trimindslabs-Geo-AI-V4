import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { 
  GEO_SAMPLES, 
  LULC_CLASSES, 
  DEEP_LEARNING_MODELS, 
  GeoSample, 
  DeepLearningModel, 
  LulcClass 
} from '../data/geoData';
import { 
  Play, 
  Cpu, 
  Layers, 
  CheckCircle2, 
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
  Compass
} from 'lucide-react';

interface GeoAiStudioProps {
  onOpenMapSelector?: () => void;
}

export const GeoAiStudio: React.FC<GeoAiStudioProps> = ({ onOpenMapSelector }) => {
  const { language, t } = useLanguage();

  const [selectedSample, setSelectedSample] = useState<GeoSample>(GEO_SAMPLES[0]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedModelId, setSelectedModelId] = useState<string>('resnet50');
  const [adapterEnabled, setAdapterEnabled] = useState<boolean>(true);
  const [spectralTab, setSpectralTab] = useState<'rgb' | 'nir' | 'ndvi' | 'ndre' | 'embedding'>('rgb');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [hasInferred, setHasInferred] = useState<boolean>(true);
  const [customFile, setCustomFile] = useState<{ name: string; size: string; channels: number } | null>(null);

  const selectedModel = DEEP_LEARNING_MODELS.find(m => m.id === selectedModelId) || DEEP_LEARNING_MODELS[0];
  const primaryClass = LULC_CLASSES.find(c => c.id === selectedSample.defaultClassId) || LULC_CLASSES[0];

  const handleRunInference = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setHasInferred(true);
    }, 700);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomFile({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        channels: file.name.toLowerCase().includes('64') || file.name.toLowerCase().includes('emb') ? 64 : 12
      });
      // Set to sample 0 with custom badge
      setSelectedSample({
        ...GEO_SAMPLES[0],
        id: 'custom-uploaded',
        name: {
          'pt-BR': `Arquivo GeoTIFF: ${file.name}`,
          en: `GeoTIFF Upload: ${file.name}`,
          es: `Archivo GeoTIFF: ${file.name}`
        },
        channels: 64
      });
    }
  };

  // Compute deterministic probabilities based on selected sample & model
  const classProbabilities = LULC_CLASSES.map(cls => {
    const isPrimary = cls.id === selectedSample.defaultClassId;
    const baseScore = isPrimary 
      ? (adapterEnabled ? selectedModel.topClassScores[cls.id] || 0.985 : 0.62)
      : (adapterEnabled ? (1 - (selectedModel.topClassScores[selectedSample.defaultClassId] || 0.98)) / 9 : 0.38 / 9);
    
    return {
      class: cls,
      probability: Math.min(0.999, Math.max(0.005, Number(baseScore.toFixed(4))))
    };
  }).sort((a, b) => b.probability - a.probability);

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

        <button
          id="btn-run-inference-main"
          onClick={handleRunInference}
          disabled={isProcessing}
          className="inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-sm text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              <span>{t.common.running}</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>{t.common.runInference}</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Selection & Model Configuration */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Input Source Selection */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                {t.studio.inputSourceTitle}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {selectedSample.sensor === 'GoogleSatelliteEmbedding' ? '64-Bands Embedding' : 'Multispectral'}
              </span>
            </div>

            {/* Sample Selector Buttons with Real-time Search */}
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
                  {GEO_SAMPLES.filter(s => s.name[language].toLowerCase().includes(searchTerm.toLowerCase()) || s.region.toLowerCase().includes(searchTerm.toLowerCase())).length} imagens disponíveis
                </span>
              </div>

              {/* Search input for operator & admin */}
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
                  const isSelected = selectedSample.id === sample.id;
                  return (
                    <button
                      key={sample.id}
                      id={`sample-select-${sample.id}`}
                      onClick={() => {
                        setSelectedSample(sample);
                        setCustomFile(null);
                      }}
                      className={`text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
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

            {/* Drag & Drop File Upload Box */}
            <div className="border border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl p-4 text-center transition-colors bg-slate-950/40">
              <input
                type="file"
                id="file-upload-input"
                accept=".tif,.tiff,.cog,.npy,.png,.jpg"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label htmlFor="file-upload-input" className="cursor-pointer block space-y-2">
                <Upload className="w-6 h-6 text-emerald-400 mx-auto" />
                <p className="text-xs text-slate-300 font-medium">
                  {t.studio.dropzoneText}
                </p>
                <p className="text-[11px] text-slate-500">
                  {t.studio.orClickUpload}
                </p>
              </label>
              {customFile && (
                <div className="mt-3 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
                  <span className="truncate max-w-[200px]">{customFile.name}</span>
                  <span className="font-mono text-[10px]">{customFile.size}</span>
                </div>
              )}
            </div>
          </div>

          {/* 2. Deep Learning Model Configuration */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
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
                      onClick={() => setSelectedModelId(model.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
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
                        <span>F1: {(model.f1Score * 100).toFixed(1)}%</span>
                        <span>{t.common.latency}: {model.inferenceLatencyMs}ms</span>
                        <span className="text-emerald-400 font-medium">64-Bands Native</span>
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
                {adapterEnabled ? t.studio.adapterEnabled : t.studio.adapterDisabled}
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
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
                  className={`px-2.5 py-1 rounded font-medium transition-all ${
                    spectralTab === 'rgb' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.studio.tabRgb}
                </button>
                <button
                  id="tab-spectral-nir"
                  onClick={() => setSpectralTab('nir')}
                  className={`px-2.5 py-1 rounded font-medium transition-all ${
                    spectralTab === 'nir' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.studio.tabNir}
                </button>
                <button
                  id="tab-spectral-ndvi"
                  onClick={() => setSpectralTab('ndvi')}
                  className={`px-2.5 py-1 rounded font-medium transition-all ${
                    spectralTab === 'ndvi' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.studio.tabNdvi}
                </button>
                <button
                  id="tab-spectral-embedding"
                  onClick={() => setSpectralTab('embedding')}
                  className={`px-2.5 py-1 rounded font-medium transition-all ${
                    spectralTab === 'embedding' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.studio.tabEmbedding}
                </button>
              </div>
            </div>

            {/* Satellite Viewport Area */}
            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center group">
              {spectralTab === 'embedding' ? (
                /* 64-Band Embedding Profile Visualization */
                <div className="w-full h-full p-4 flex flex-col justify-between bg-slate-950">
                  <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                    <span className="font-mono text-sky-400">GoogleSatelliteEmbedding_v1 Tensor (64, 64, 64)</span>
                    <span className="text-[11px] text-emerald-400">Dimension Vector Space [-1.0 to +1.0]</span>
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
                    <span>NIR Reflectance: <strong className="text-sky-300">{(selectedSample.simulatedBands.nir * 100).toFixed(0)}%</strong></span>
                  </div>
                </div>
              ) : (
                /* Image View with Simulated Filter overlays */
                <div className="w-full h-full relative">
                  <img
                    src={selectedSample.previewUrl}
                    alt={selectedSample.name[language]}
                    className={`w-full h-full object-cover transition-all duration-300 ${
                      spectralTab === 'nir' ? 'contrast-125 saturate-200 hue-rotate-90' :
                      spectralTab === 'ndvi' ? 'grayscale contrast-150 invert sepia hue-rotate-60' : ''
                    }`}
                  />
                  {/* Overlay badge with sample info */}
                  <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-sm border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs text-white">
                    <span className="font-semibold">{selectedSample.region}</span>
                    <span className="text-slate-400 text-[11px] block">{selectedSample.biome[language]}</span>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-sm border border-slate-700/60 rounded-lg px-3 py-1 text-[11px] font-mono text-emerald-400">
                    BBox: [{selectedSample.coordinates.bbox.join(', ')}]
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. Inference Results & Class Probabilities */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                {t.studio.inferenceResultsTitle}
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                {t.common.latency}: {selectedModel.inferenceLatencyMs}ms (CPU Deterministic Engine)
              </span>
            </div>

            {/* Primary Classification Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base shadow-md"
                  style={{ backgroundColor: `${primaryClass.color}25`, color: primaryClass.color, border: `1px solid ${primaryClass.color}50` }}
                >
                  {primaryClass.code}
                </div>
                <div>
                  <span className="text-xs text-slate-400">{t.studio.primaryClassDetected}</span>
                  <div className="text-base sm:text-lg font-extrabold text-white">
                    {primaryClass.name[language]}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                    {primaryClass.description[language]}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs text-slate-400">{t.studio.confidenceScore}</span>
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  {adapterEnabled ? '99.4%' : '62.1%'}
                </div>
                {!adapterEnabled && (
                  <span className="text-[10px] text-amber-400 flex items-center gap-1 justify-end">
                    <AlertTriangle className="w-3 h-3" />
                    Adapter Desativado
                  </span>
                )}
              </div>
            </div>

            {/* Probability Bars for 10 Classes */}
            <div className="space-y-2 pt-2">
              <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                <span>{t.studio.classDistribution}</span>
                <span>Softmax Distribution</span>
              </div>
              <div className="space-y-2">
                {classProbabilities.slice(0, 5).map(item => {
                  const pct = (item.probability * 100).toFixed(1);
                  return (
                    <div key={item.class.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium flex items-center gap-1.5">
                          <span 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: item.class.color }}
                          ></span>
                          {item.class.name[language]}
                        </span>
                        <span className="font-mono text-slate-400">{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: item.class.color
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
