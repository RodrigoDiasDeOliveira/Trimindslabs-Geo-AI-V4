import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { GEO_SAMPLES, GeoSample } from '../data/geoData';
import { 
  Clock, 
  TrendingUp, 
  Calendar, 
  ShieldCheck, 
  ArrowRight, 
  Layers,
  Sparkles,
  BarChart2
} from 'lucide-react';

export const TimeSeriesView: React.FC = () => {
  const { language, t } = useLanguage();
  const [selectedSample, setSelectedSample] = useState<GeoSample>(GEO_SAMPLES[0]);
  const [selectedYear, setSelectedYear] = useState<number>(2024);

  const currentYearData = selectedSample.timeSeriesHistory.find(h => h.year === selectedYear) || selectedSample.timeSeriesHistory[4];
  const baseYearData = selectedSample.timeSeriesHistory[0]; // 2020

  const cropDelta = currentYearData.cropCoverPct - baseYearData.cropCoverPct;
  const pastureDelta = currentYearData.pastureCoverPct - baseYearData.pastureCoverPct;
  const forestDelta = currentYearData.forestCoverPct - baseYearData.forestCoverPct;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-6 h-6" />
            </span>
            {t.timeseries.title}
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-1 max-w-3xl">
            {t.timeseries.subtitle}
          </p>
        </div>

        {/* Biome Sample Switcher */}
        <select
          id="select-timeseries-sample"
          value={selectedSample.id}
          onChange={(e) => {
            const found = GEO_SAMPLES.find(s => s.id === e.target.value);
            if (found) setSelectedSample(found);
          }}
          className="bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-emerald-500"
        >
          {GEO_SAMPLES.map(sample => (
            <option key={sample.id} value={sample.id}>
              {sample.name[language]}
            </option>
          ))}
        </select>
      </div>

      {/* Year Slider Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">
              {t.timeseries.selectYear}: <strong className="text-amber-400 text-lg font-mono">{selectedYear}</strong>
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Mosaico Sentinel-2 / Landsat 8 Anual
          </span>
        </div>

        {/* Year Buttons Strip */}
        <div className="grid grid-cols-5 gap-2 sm:gap-4">
          {[2020, 2021, 2022, 2023, 2024].map(year => {
            const isSelected = selectedYear === year;
            return (
              <button
                key={year}
                id={`btn-year-${year}`}
                onClick={() => setSelectedYear(year)}
                className={`py-3 px-2 rounded-xl text-center font-bold text-sm transition-all border ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20 scale-105'
                    : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {year}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Annual Coverage Stats */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              {t.timeseries.historicalTrend} ({selectedYear})
            </h2>

            <div className="space-y-4">
              {/* Forest Cover */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-emerald-400">Floresta Nativa</span>
                  <span className="text-white font-mono">{currentYearData.forestCoverPct}%</span>
                </div>
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${currentYearData.forestCoverPct}%` }}
                  ></div>
                </div>
              </div>

              {/* Crop Cover */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-yellow-400">Lavoura Anual (Soja/Milho)</span>
                  <span className="text-white font-mono">{currentYearData.cropCoverPct}%</span>
                </div>
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="h-full bg-yellow-500 rounded-full transition-all duration-500"
                    style={{ width: `${currentYearData.cropCoverPct}%` }}
                  ></div>
                </div>
              </div>

              {/* Pasture Cover */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-lime-400">Pastagem</span>
                  <span className="text-white font-mono">{currentYearData.pastureCoverPct}%</span>
                </div>
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="h-full bg-lime-500 rounded-full transition-all duration-500"
                    style={{ width: `${currentYearData.pastureCoverPct}%` }}
                  ></div>
                </div>
              </div>

              {/* Water Cover */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-sky-400">Recursos Hídricos</span>
                  <span className="text-white font-mono">{currentYearData.waterCoverPct}%</span>
                </div>
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="h-full bg-sky-500 rounded-full transition-all duration-500"
                    style={{ width: `${currentYearData.waterCoverPct}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Mean NDVI Value */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">{t.timeseries.ndviEvolution}</span>
                <span className="text-lg font-black text-emerald-400 font-mono">NDVI {currentYearData.ndviMean}</span>
              </div>
              <div className="text-right text-xs text-slate-400">
                <span>Refletância Vigorosa</span>
                <span className="text-emerald-400 font-bold block">Biomassa Saudável</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Land Transition Delta 2020 vs 2024 & Alerts */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-sky-400" />
              {t.timeseries.transitionMatrixTitle}
            </h2>

            {/* Transition Deltas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-xs text-slate-400 block">Lavoura Soja</span>
                <span className={`text-xl font-bold font-mono ${cropDelta >= 0 ? 'text-yellow-400' : 'text-slate-400'}`}>
                  {cropDelta > 0 ? `+${cropDelta}%` : `${cropDelta}%`}
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">Intensificação</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-xs text-slate-400 block">Pastagens</span>
                <span className={`text-xl font-bold font-mono ${pastureDelta <= 0 ? 'text-lime-400' : 'text-slate-400'}`}>
                  {pastureDelta}%
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">Conversão para Lavoura</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-xs text-slate-400 block">Floresta Nativa</span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  {forestDelta}%
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">Estabilidade Total</span>
              </div>
            </div>

            {/* Deforestation Alert Banner */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-emerald-300">
                  {t.timeseries.deforestationAlert}
                </span>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Algoritmo de detecção de corte raso (SAD / Prodes) não identificou alertas de supressão vegetal no polígono monitorado entre 2020 e 2024.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
