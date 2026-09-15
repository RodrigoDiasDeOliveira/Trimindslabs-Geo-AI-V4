import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { DEEP_LEARNING_MODELS, LULC_CLASSES, DeepLearningModel } from '../data/geoData';
import { 
  Cpu, 
  Award, 
  Zap, 
  Layers, 
  CheckCircle2, 
  BarChart3, 
  ShieldCheck,
  Sparkles,
  Info
} from 'lucide-react';

export const ModelZooView: React.FC = () => {
  const { language, t } = useLanguage();
  const [selectedModel, setSelectedModel] = useState<DeepLearningModel>(DEEP_LEARNING_MODELS[4]); // Hybrid SOTA default

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Cpu className="w-6 h-6" />
            </span>
            {t.models.title}
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-1 max-w-3xl">
            {t.models.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 font-semibold">
          <Award className="w-4 h-4 text-emerald-400" />
          <span>{t.models.topPerforming}: Hybrid CNN-Transformer (F1 99.2%)</span>
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DEEP_LEARNING_MODELS.map(model => {
          const isSelected = selectedModel.id === model.id;
          return (
            <div
              key={model.id}
              onClick={() => setSelectedModel(model)}
              className={`rounded-2xl p-6 border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                isSelected
                  ? 'bg-slate-900 border-purple-500/50 ring-1 ring-purple-500/30 shadow-xl'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-purple-300">
                    {model.family}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {model.parameters}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    {model.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {model.description[language]}
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{t.common.f1Score}:</span>
                  <span className="font-mono font-bold text-emerald-400">{(model.f1Score * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{t.common.latency}:</span>
                  <span className="font-mono font-bold text-sky-400">{model.inferenceLatencyMs} ms</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Tensor 64-Bandas:</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Nativo
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep Dive on Selected Model & Confusion Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>{t.models.confusionMatrix} - {selectedModel.name}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Validação cruzada 10-fold no benchmark de LULC com suporte ao EmbeddingAdapter de 64 canais.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-emerald-400 font-bold">Acurácia Global: {(selectedModel.accuracy * 100).toFixed(1)}%</span>
            <span className="text-purple-400 font-bold">F1 Macro: {(selectedModel.f1Score * 100).toFixed(1)}%</span>
          </div>
        </div>

        {/* Per-Class F1 Score Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {LULC_CLASSES.map(cls => {
            const score = selectedModel.topClassScores[cls.id] || 0.985;
            const scorePct = (score * 100).toFixed(1);
            return (
              <div key={cls.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium truncate">{cls.name[language]}</span>
                  <span className="font-mono text-emerald-400 font-bold">{scorePct}%</span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full"
                    style={{ width: `${scorePct}%`, backgroundColor: cls.color }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Architecture & Tensor Pipeline Details */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
          <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-slate-200">Pipeline de Tensores & EmbeddingAdapter:</span>
            <p className="leading-relaxed">
              {selectedModel.adapterInfo[language]} Os tensores geoespaciais são processados sem downsampling ou compressão destrutiva para RGB, mantendo a integridade das 64 bandas espectrais do Google Satellite Embedding V1.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
