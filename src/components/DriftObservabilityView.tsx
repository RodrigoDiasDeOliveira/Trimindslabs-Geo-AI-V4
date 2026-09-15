import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { SIMULATED_DRIFT_METRICS, DriftBandMetric } from '../data/geoData';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Send, 
  Sliders, 
  TrendingDown, 
  Layers,
  Database,
  Radio,
  Bell
} from 'lucide-react';

export const DriftObservabilityView: React.FC = () => {
  const { language, t } = useLanguage();
  const [metrics, setMetrics] = useState<DriftBandMetric[]>(SIMULATED_DRIFT_METRICS);
  const [hasSimulatedShift, setHasSimulatedShift] = useState<boolean>(false);
  const [alertSent, setAlertSent] = useState<boolean>(false);

  const handleSimulateShift = () => {
    if (!hasSimulatedShift) {
      setMetrics(prev => prev.map(m => {
        if (m.bandIndex === 3 || m.bandIndex === 4 || m.bandIndex === 6) {
          return {
            ...m,
            currentMean: m.baselineMean * 1.35,
            psi: 0.32,
            ksStatistic: 0.22,
            pValue: 0.001,
            driftStatus: 'CRITICAL'
          };
        }
        return m;
      }));
      setHasSimulatedShift(true);
    } else {
      setMetrics(SIMULATED_DRIFT_METRICS);
      setHasSimulatedShift(false);
    }
  };

  const handleTriggerPubSub = () => {
    setAlertSent(true);
    setTimeout(() => setAlertSent(false), 4000);
  };

  const criticalBandsCount = metrics.filter(m => m.driftStatus === 'CRITICAL').length;
  const warningBandsCount = metrics.filter(m => m.driftStatus === 'WARNING').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Activity className="w-6 h-6" />
            </span>
            {t.drift.title}
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-1 max-w-3xl">
            {t.drift.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            id="btn-simulate-drift"
            onClick={handleSimulateShift}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>{hasSimulatedShift ? 'Restaurar Baseline Estável' : t.drift.simulateSeasonal}</span>
          </button>

          <button
            id="btn-trigger-pubsub"
            onClick={handleTriggerPubSub}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-95 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span>{t.drift.triggerPubSub}</span>
          </button>
        </div>
      </div>

      {alertSent && (
        <div className="p-4 bg-amber-500/15 border border-amber-500/30 rounded-2xl text-xs text-amber-300 flex items-center gap-3 animate-fade-in">
          <Radio className="w-5 h-5 text-amber-400 animate-pulse shrink-0" />
          <span>{t.drift.alertSent} Payload com métricas PSI e bandas críticas despachado para o Vertex AI Custom Training Pipeline.</span>
        </div>
      )}

      {/* Top Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
          <span className="text-xs text-slate-400">{t.drift.systemStatus}</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm font-bold text-white">Google Earth Engine Ingestion</span>
          </div>
          <span className="text-[11px] text-slate-500 block">Throughput: 1.250 tiles/min</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
          <span className="text-xs text-slate-400">Bandas com Deriva Crítica</span>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {criticalBandsCount} / 64 Bandas
          </div>
          <span className="text-[11px] text-slate-500 block">PSI &gt; 0.20 (RedEdge / NIR)</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
          <span className="text-xs text-slate-400">Teste Kolmogorov-Smirnov</span>
          <div className="text-2xl font-bold font-mono text-sky-400 mt-1">
            p-val &lt; 0.01
          </div>
          <span className="text-[11px] text-slate-500 block">Significância Estatística Confirmada</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
          <span className="text-xs text-slate-400">Auto-Retreinamento MLOps</span>
          <div className="text-sm font-bold text-emerald-400 mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Vertex AI Trigger Ready
          </div>
          <span className="text-[11px] text-slate-500 block">Cloud Pub/Sub Webhook Configurado</span>
        </div>
      </div>

      {/* Metrics Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            {t.drift.spectralBandsTable}
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            Amostra de 10.000 tensores de inferência
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Banda Espectral</th>
                <th className="px-5 py-3">Comprimento de Onda</th>
                <th className="px-5 py-3">Baseline (μ ± σ)</th>
                <th className="px-5 py-3">Atual (μ ± σ)</th>
                <th className="px-5 py-3">PSI (Estabilidade)</th>
                <th className="px-5 py-3">KS-Statistic</th>
                <th className="px-5 py-3">p-Value</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {metrics.map((row) => (
                <tr key={row.bandIndex} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3 font-semibold text-slate-200 font-sans">
                    {row.bandName}
                  </td>
                  <td className="px-5 py-3 text-slate-400">
                    {row.wavelengthNm || 'N/A (Latent)'}
                  </td>
                  <td className="px-5 py-3 text-slate-300">
                    {row.baselineMean.toFixed(3)} ± {row.baselineStd.toFixed(3)}
                  </td>
                  <td className="px-5 py-3 text-slate-200 font-bold">
                    {row.currentMean.toFixed(3)} ± {row.currentStd.toFixed(3)}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`font-bold ${row.psi > 0.20 ? 'text-amber-400' : row.psi > 0.10 ? 'text-yellow-300' : 'text-emerald-400'}`}>
                      {row.psi.toFixed(3)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-300">
                    {row.ksStatistic.toFixed(3)}
                  </td>
                  <td className="px-5 py-3 text-slate-400">
                    {row.pValue.toFixed(3)}
                  </td>
                  <td className="px-5 py-3 font-sans">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      row.driftStatus === 'CRITICAL' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      row.driftStatus === 'WARNING' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {row.driftStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
