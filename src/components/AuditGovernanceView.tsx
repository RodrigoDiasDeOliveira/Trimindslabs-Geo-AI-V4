import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { AUDIT_PHASES, DATA_LINEAGE_CHAIN, GOVERNANCE_GATES } from '../data/auditGovernanceData';
import { AuditPhase, DataLineageNode, GovernanceGate } from '../types';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  GitBranch, 
  Cpu, 
  Terminal, 
  Cloud, 
  FileCode, 
  Layers, 
  Lock, 
  ArrowRight, 
  RefreshCw, 
  Sliders, 
  Database,
  Copy,
  Zap,
  Activity,
  AlertOctagon,
  FileCheck2,
  Server
} from 'lucide-react';

export const AuditGovernanceView: React.FC = () => {
  const { language, t } = useLanguage();
  const [selectedPhaseId, setSelectedPhaseId] = useState<'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5'>('phase1');
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'lineage' | 'gates' | 'strict_loading' | 'terraform'>('overview');
  
  // Interactive Simulator States
  const [configArchitecture, setConfigArchitecture] = useState<'resnet50_64ch' | 'hybrid_cnn_vit' | 'efficientnet_b0_64ch'>('hybrid_cnn_vit');
  const [configBackbone, setConfigBackbone] = useState<'hybrid_cnn_vit' | 'resnet50' | 'efficientnet_b0'>('hybrid_cnn_vit');
  const [configCheckResult, setConfigCheckResult] = useState<{ status: 'PASS' | 'FAIL'; message: string } | null>(null);

  // Model Loading Strict Simulator
  const [loadingMode, setLoadingMode] = useState<'strict_true' | 'strict_false'>('strict_true');
  const [simulatedChecksumMatch, setSimulatedChecksumMatch] = useState<boolean>(true);
  const [loadResult, setLoadResult] = useState<string | null>(null);

  // Champion / Challenger Rollback Simulator
  const [championTraffic, setChampionTraffic] = useState<number>(90);
  const [isRollingBack, setIsRollingBack] = useState<boolean>(false);
  const [rollbackSuccess, setRollbackSuccess] = useState<boolean>(false);

  const selectedPhase = AUDIT_PHASES.find(p => p.id === selectedPhaseId) || AUDIT_PHASES[0];

  const handleValidateConfig = () => {
    if (
      (configArchitecture === 'resnet50_64ch' && configBackbone !== 'resnet50') ||
      (configArchitecture === 'hybrid_cnn_vit' && configBackbone !== 'hybrid_cnn_vit') ||
      (configArchitecture === 'efficientnet_b0_64ch' && configBackbone !== 'efficientnet_b0')
    ) {
      setConfigCheckResult({
        status: 'FAIL',
        message: `🔴 Inconsistência Detectada! A configuração declara '${configArchitecture}', mas o backbone aponta para '${configBackbone}'. O Schema Pydantic rejeita a compilação (Fail Fast).`
      });
    } else {
      setConfigCheckResult({
        status: 'PASS',
        message: `🟢 Configuração Consistente! 'model.architecture' (${configArchitecture}) coincide 100% com o backbone '${configBackbone}' e com o hash do artefato no GCS.`
      });
    }
  };

  const handleSimulateModelLoad = () => {
    if (!simulatedChecksumMatch) {
      if (loadingMode === 'strict_true') {
        setLoadResult("🔴 FAIL FAST (Proteção Ativa): SecurityChecksumMismatchError disparado. O artefato não corresponde ao hash SHA-256 esperado. A execução foi interrompida antes de comprometer a memória GPU.");
      } else {
        setLoadResult("⚠️ RISCO DE PRODUÇÃO (strict=False): O modelo carregou pesos parciais silenciosamente com tensores faltantes. Resultados de inferência corrompidos sem aviso!");
      }
    } else {
      setLoadResult("🟢 SUCESSO ENTERPRISE: Checksum SHA-256 verificado com sucesso. model.load_state_dict(state, strict=True) completado em 14ms sem incompatibilidade de tensores.");
    }
  };

  const handleTriggerRollback = () => {
    setIsRollingBack(true);
    setTimeout(() => {
      setIsRollingBack(false);
      setChampionTraffic(100);
      setRollbackSuccess(true);
      setTimeout(() => setRollbackSuccess(false), 4000);
    }, 800);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Title & Audit Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold tracking-wider uppercase mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Auditoria & Governança Enterprise • 5 Fases</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Matriz de Production Readiness & Governança MLOps
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-1 max-w-3xl">
            Validação técnica, correção de inconsistências conceituais, data lineage de 64 bandas, gates de promoção e infraestrutura GCP em conformidade com os padrões de produção.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-4 py-2.5 flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
            <div>
              <span className="text-[10px] text-slate-400 font-mono block">Status Geral da Auditoria</span>
              <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
                100% PRODUCTION READY (5/5 PASS)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Phase Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {AUDIT_PHASES.map((phase) => {
          const isSelected = phase.id === selectedPhaseId;
          return (
            <button
              key={phase.id}
              id={`btn-phase-${phase.id}`}
              onClick={() => setSelectedPhaseId(phase.id)}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                isSelected
                  ? 'bg-slate-900 border-emerald-500/50 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                }`}>
                  Fase {phase.number}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Pronto
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-200 line-clamp-1">
                {phase.title[language] || phase.title['pt-BR']}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                {phase.summary[language] || phase.summary['pt-BR']}
              </p>
            </button>
          );
        })}
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
            activeSubTab === 'overview'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Visão Geral & Correções da Fase {selectedPhase.number}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('lineage')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
            activeSubTab === 'lineage'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <GitBranch className="w-4 h-4 text-sky-400" />
          <span>Data Lineage & Reproducibility (Fase 2)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('gates')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
            activeSubTab === 'gates'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>Gates de Promoção & Champion/Challenger (Fase 3)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('strict_loading')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
            activeSubTab === 'strict_loading'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Lock className="w-4 h-4 text-purple-400" />
          <span>Simulador Strict=True vs Strict=False (Fase 4)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('terraform')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
            activeSubTab === 'terraform'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Cloud className="w-4 h-4 text-indigo-400" />
          <span>Infraestrutura GCP & Terraform (Fase 5)</span>
        </button>
      </div>

      {/* SUB-VIEW 1: OVERVIEW & KEY FIXES */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
              <div>
                <span className="text-xs font-mono text-emerald-400 font-bold">FASE {selectedPhase.number} DETALHADA</span>
                <h2 className="text-xl font-bold text-white mt-1">
                  {selectedPhase.title[language] || selectedPhase.title['pt-BR']}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                  Status: PRODUCTION READY
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              {selectedPhase.summary[language] || selectedPhase.summary['pt-BR']}
            </p>

            <div className="space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Correções Estruturais e Contratos Implementados
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {selectedPhase.keyFixes.map((fix, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{fix.title[language] || fix.title['pt-BR']}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        {fix.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {fix.description[language] || fix.description['pt-BR']}
                    </p>

                    {fix.codeSnippet && (
                      <pre className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                        {fix.codeSnippet}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: DATA LINEAGE & CONFIG CONSISTENCY CHECKER */}
      {activeSubTab === 'lineage' && (
        <div className="space-y-6">
          {/* Config Inconsistency Fixer Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                  <Sliders className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Validador de Consistência de Configuração (Resolução model.name vs backbone)
                  </h3>
                  <span className="text-xs text-slate-400">
                    Garante que a configuração declarada coincida estritamente com o backbone instanciado e com os pesos do artefato.
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  model.architecture (Declarado na Configuração)
                </label>
                <select
                  value={configArchitecture}
                  onChange={(e) => setConfigArchitecture(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 font-mono focus:border-emerald-500 outline-none"
                >
                  <option value="hybrid_cnn_vit">hybrid_cnn_vit (Triminds SOTA 64ch)</option>
                  <option value="resnet50_64ch">resnet50_64ch (ResNet-50 64ch)</option>
                  <option value="efficientnet_b0_64ch">efficientnet_b0_64ch (Edge 64ch)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  pretrained_backbone (Carregado na Implementação)
                </label>
                <select
                  value={configBackbone}
                  onChange={(e) => setConfigBackbone(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 font-mono focus:border-emerald-500 outline-none"
                >
                  <option value="hybrid_cnn_vit">hybrid_cnn_vit</option>
                  <option value="resnet50">resnet50</option>
                  <option value="efficientnet_b0">efficientnet_b0</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                id="btn-run-config-check"
                onClick={handleValidateConfig}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:scale-95 transition-all shadow-md shadow-emerald-500/20"
              >
                Validar Consistência de Configuração
              </button>

              <span className="text-xs text-slate-400 font-mono">
                Regra: configuration == implementation == artifact
              </span>
            </div>

            {configCheckResult && (
              <div className={`p-4 rounded-xl text-xs font-mono border animate-fade-in ${
                configCheckResult.status === 'PASS'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                {configCheckResult.message}
              </div>
            )}
          </div>

          {/* Full Data Lineage Visualizer */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Cadeia de Linhagem de Dados (Data Lineage & Reproducibility)
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">Seed: 42 • PyTorch Deterministic</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DATA_LINEAGE_CHAIN.map((node, index) => (
                <div key={node.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 uppercase">
                      Etapa {index + 1}: {node.stage}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      {node.version}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white">{node.name}</h4>
                  <div className="text-[11px] font-mono text-slate-400 truncate bg-slate-900 p-1.5 rounded border border-slate-800">
                    {node.hash}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[10px] text-slate-400">
                    {Object.entries(node.metadata).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-slate-500 font-mono">{k}:</span>
                        <span className="text-slate-300 font-mono font-medium">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: GOVERNANCE GATES & CHAMPION / CHALLENGER */}
      {activeSubTab === 'gates' && (
        <div className="space-y-6">
          {/* Governance Progression Gates */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  Validation Gates de Promoção para Produção
                </h3>
                <span className="text-xs text-slate-400">
                  Experiment → Evaluation → Candidate → Validation Gate → Registered Model → Approved → Production
                </span>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                MLflow & Vertex AI Registry Sync
              </span>
            </div>

            <div className="space-y-3">
              {GOVERNANCE_GATES.map((gate) => (
                <div key={gate.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span className="text-xs font-bold text-white">{gate.stepName}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Regra de Validação: <span className="text-slate-300">{gate.rule}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Resultado Obtido</span>
                      <span className="font-bold text-emerald-400">{gate.actualMetric}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Aprovado Por</span>
                      <span className="text-slate-300">{gate.signOffBy}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Champion / Challenger Traffic Splitter & Rollback */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Estratégia Champion / Challenger & Rollback em 1 Clique
                  </h3>
                  <span className="text-xs text-slate-400">
                    Divisão de tráfego em tempo real entre o modelo estável e o modelo candidato
                  </span>
                </div>
              </div>

              <button
                id="btn-trigger-rollback"
                onClick={handleTriggerRollback}
                disabled={isRollingBack || championTraffic === 100}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRollingBack ? 'animate-spin' : ''}`} />
                <span>Rollback Imediato (100% Champion)</span>
              </button>
            </div>

            {rollbackSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Rollback efetuado com sucesso! 100% do tráfego redirecionado para o Champion (v2.4.0) sem downtime.</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    CHAMPION: Hybrid CNN-ViT (v2.4.0)
                  </span>
                  <span className="text-xs font-mono font-bold text-white">{championTraffic}% Tráfego</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${championTraffic}%` }}></div>
                </div>
                <span className="text-[11px] text-slate-400 block font-mono">F1-Score: 0.992 • PSI: 0.012 (Estável)</span>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                    CHALLENGER: Swin-Tiny v2.5.0-rc1
                  </span>
                  <span className="text-xs font-mono font-bold text-white">{100 - championTraffic}% Tráfego</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${100 - championTraffic}%` }}></div>
                </div>
                <span className="text-[11px] text-slate-400 block font-mono">F1-Score: 0.989 • Monitoramento Ativo</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: STRICT LOADING VS STRICT FALSE SIMULATOR */}
      {activeSubTab === 'strict_loading' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Hardening de Carga de Modelo: strict=True + Checksum SHA-256 vs strict=False
                  </h3>
                  <span className="text-xs text-slate-400">
                    Demonstração da mitigação de riscos de pesos parciais silenciosos e adulteração de artefatos.
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Modo de Carregamento PyTorch
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setLoadingMode('strict_true')}
                    className={`p-2.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                      loadingMode === 'strict_true'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    strict=True (Enterprise Fail Fast)
                  </button>
                  <button
                    onClick={() => setLoadingMode('strict_false')}
                    className={`p-2.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                      loadingMode === 'strict_false'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    strict=False (Inseguro / Permissivo)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Integridade do Checksum SHA-256 do Arquivo de Pesos (.pt)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSimulatedChecksumMatch(true)}
                    className={`p-2.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                      simulatedChecksumMatch
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    SHA-256 Válido (e3b0c4...)
                  </button>
                  <button
                    onClick={() => setSimulatedChecksumMatch(false)}
                    className={`p-2.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                      !simulatedChecksumMatch
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    SHA-256 Corrompido / Incompatível
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                id="btn-simulate-load"
                onClick={handleSimulateModelLoad}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-purple-400 hover:bg-purple-300 active:scale-95 transition-all shadow-md shadow-purple-500/20 cursor-pointer"
              >
                Simular Carregamento no Pod de Inferência
              </button>
            </div>

            {loadResult && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 leading-relaxed animate-fade-in">
                {loadResult}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 5: GCP ARCHITECTURE & TERRAFORM BLUEPRINT */}
      {activeSubTab === 'terraform' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Infraestrutura GCP & Código Terraform Declarativo (IaC)
                  </h3>
                  <span className="text-xs text-slate-400">
                    Vertex AI Private Endpoint, GCS Data Lake, BigQuery Feature Store e Dataproc Serverless
                  </span>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-mono">
                Terraform HCL 1.6+
              </span>
            </div>

            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-indigo-300 overflow-x-auto max-h-96 leading-relaxed">
{`# Triminds Geo AI - Production Infrastructure as Code
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.10"
    }
  }
}

# 1. Bucket GCS para Embeddings & Model Checkpoints
resource "google_storage_bucket" "geo_lake" {
  name          = "triminds-geoai-datalake-prod"
  location      = "US-CENTRAL1"
  force_destroy = false
  versioning {
    enabled = true
  }
  lifecycle_rule {
    action { type = "SetStorageClass"; storage_class = "NEARLINE" }
    condition { age = 90 }
  }
}

# 2. Vertex AI Private Endpoint com GPU A100 / T4
resource "google_vertex_ai_endpoint" "geoai_endpoint" {
  name         = "triminds-geoai-endpoint-prod"
  display_name = "Triminds GeoAI 64-Bands LULC Classifier"
  location     = "us-central1"
  network      = google_compute_network.geo_vpc.id
}

# 3. BigQuery Dataset para Observabilidade de Drift & Telemetria
resource "google_bigquery_dataset" "drift_telemetry" {
  dataset_id  = "triminds_geoai_telemetry"
  description = "Armazenamento analítico de métricas PSI e inferências"
  location    = "US"
}

# 4. Pub/Sub Topic para Gatilho de Retreinamento Automático (Vertex Pipeline)
resource "google_pubsub_topic" "retraining_trigger" {
  name = "geoai-drift-retraining-trigger"
}`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
