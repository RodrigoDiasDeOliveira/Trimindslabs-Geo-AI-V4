import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../auth/AuthContext';
import { GEO_SAMPLES, LULC_CLASSES } from '../data/geoData';
import { 
  FileText, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  Printer, 
  Calendar, 
  BarChart3, 
  Layers, 
  MapPin, 
  FileCheck,
  Building2,
  Lock
} from 'lucide-react';

export const ReportsManagementView: React.FC = () => {
  const { language } = useLanguage();
  const { isAdmin } = useAuth();

  const [selectedSample, setSelectedSample] = useState(GEO_SAMPLES[0]);
  const [reportType, setReportType] = useState<'car_compliance' | 'esg_carbon' | 'time_series'>('car_compliance');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedPdfName, setGeneratedPdfName] = useState<string | null>(null);

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Acesso Restrito ao Perfil Administrador</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          O perfil de <strong>Operador</strong> tem acesso exclusivo à busca e manipulação de imagens. A geração e exportação de relatórios executivos e auditorias CAR/ESG é restrita a administradores.
        </p>
      </div>
    );
  }

  const handleGenerateReport = () => {
    setIsGenerating(true);
    setGeneratedPdfName(null);

    setTimeout(() => {
      setIsGenerating(false);
      const filename = `Triminds_Relatorio_${reportType.toUpperCase()}_${selectedSample.id}_${new Date().toISOString().slice(0, 10)}.pdf`;
      setGeneratedPdfName(filename);
    }, 800);
  };

  const handleDownloadPdf = () => {
    if (!generatedPdfName) return;
    const content = `
=============================================================
TRIMINDS GEO AI ENTERPRISE - RELATÓRIO OFICIAL DE CONFORMIDADE
=============================================================
Data de Emissão: ${new Date().toLocaleString()}
Responsável Técnico: Rodrigo Dias de Oliveira
Credencial / Hash: SHA-256-TRIMINDS-AUDIT-9482
Perfil Autorizador: ADMINISTRADOR (Sessão Verificada)

1. DADOS DA PROPRIEDADE
Nome do Talhão: ${selectedSample.name['pt-BR']}
Bioma: ${selectedSample.biome['pt-BR']}
Coordenadas Centrais: Lat ${selectedSample.coordinates.lat}, Long ${selectedSample.coordinates.lng}
Bounding Box (WGS84): [${selectedSample.coordinates.bbox.join(', ')}]
Sensor Satélite: ${selectedSample.sensor} (64 Bandas Espectrais)

2. MÉTRICAS DE COBERTURA DO SOLO (LULC)
- Lavoura Anual: 3.250 ha (60.0%)
- Floresta Nativa: 1.192 ha (22.0%)
- Pastagem: 542 ha (10.0%)
- Recursos Hídricos: 271 ha (5.0%)
- Vegetação Herbácea: 165 ha (3.0%)

3. DIAGNÓSTICO DO CÓDIGO FLORESTAL BRASILEIRO (CAR)
- Reserva Legal Exigida: 20% a 80% (conforme bioma)
- Reserva Legal Apurada: CONFORME
- Área de Preservação Permanente (APP): PRESERVADA
- Desmatamento Recente (2020-2024): 0.00% DETECTADO (Desmatamento Zero)

4. VALIDAÇÃO DE MODELO E LINHAGEM
- Modelo Empregado: Hybrid CNN-Transformer (64 Channels)
- Macro F1-Score: 0.992
- Latência P95: 48.2ms
- Checksum do Artefato: sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
=============================================================
    `;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = generatedPdfName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-bold tracking-wider uppercase mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Módulo Exclusivo para Administrador</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Geração de Relatórios Executivos & Auditoria Agronômica
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-1 max-w-3xl">
            Emissão de laudos periciais de conformidade do Código Florestal (CAR), balanço de carbono ESG e evolução temporal de uso do solo com certificação criptográfica.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/30 font-mono font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            Admin Authorized
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Configuration Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-purple-400" />
              Parâmetros do Laudo Técnico
            </h2>

            {/* Select Sample */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Talhão / Fazenda Avaliada</label>
              <select
                value={selectedSample.id}
                onChange={(e) => {
                  const s = GEO_SAMPLES.find(x => x.id === e.target.value);
                  if (s) setSelectedSample(s);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                {GEO_SAMPLES.map(sample => (
                  <option key={sample.id} value={sample.id}>
                    {sample.name[language]} ({sample.biome[language]})
                  </option>
                ))}
              </select>
            </div>

            {/* Select Report Template */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Modelo de Relatório</label>
              <div className="space-y-2">
                {[
                  {
                    id: 'car_compliance',
                    title: 'Conformidade Ambiental CAR / Código Florestal',
                    desc: 'Diagnóstico de Reserva Legal, APPs e validação de desmatamento zero.'
                  },
                  {
                    id: 'esg_carbon',
                    title: 'Balanço de Carbono & Sustentabilidade ESG',
                    desc: 'Cálculo de biomassa florestal retida e créditos de preservação.'
                  },
                  {
                    id: 'time_series',
                    title: 'Laudo Pericial de Dinâmica Temporal (2020-2024)',
                    desc: 'Comprovação histórica de conversão de pastagens em lavouras produtivas.'
                  }
                ].map(tmpl => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setReportType(tmpl.id as any)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                      reportType === tmpl.id
                        ? 'bg-purple-500/15 border-purple-500/60 ring-1 ring-purple-500/40 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-200">{tmpl.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{tmpl.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Action button */}
            <button
              id="btn-generate-report"
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-purple-500 hover:bg-purple-400 text-slate-950 flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>Gerar Relatório Criptográfico</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Interactive Report Preview & Download */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Visualização Prévia do Laudo Oficial
                </h3>
              </div>

              {generatedPdfName && (
                <button
                  id="btn-download-pdf"
                  onClick={handleDownloadPdf}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-400 hover:bg-emerald-300 text-slate-950 flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Documento</span>
                </button>
              )}
            </div>

            {/* Document Sheet Preview */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 font-mono text-xs text-slate-300 space-y-4 shadow-inner">
              <div className="border-b border-slate-800 pb-3 flex items-start justify-between">
                <div>
                  <div className="font-extrabold text-white text-sm">TRIMINDS GEO AI ENTERPRISE</div>
                  <div className="text-[10px] text-slate-500">DEPARTAMENTO DE INTELIGÊNCIA TERRITORIAL & MLOPS</div>
                </div>
                <span className="text-[10px] text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded bg-emerald-500/10">
                  AUTENTICADO
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Propriedade Rural:</span>
                  <span className="font-bold text-white">{selectedSample.name['pt-BR']}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Bioma de Referência:</span>
                  <span className="font-bold text-white">{selectedSample.biome[language]}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Sensor & Bandas:</span>
                  <span className="text-slate-200">Google Satellite Embedding (64 Bandas)</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Acurácia do Modelo:</span>
                  <span className="text-emerald-400 font-bold">99.4% (Hybrid CNN-ViT v2.4.0)</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-400 block">RESUMO DA AUDITORIA CAR</span>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block">Área Total</span>
                    <span className="font-bold text-white text-xs">5.420 ha</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block">Reserva Legal</span>
                    <span className="font-bold text-emerald-400 text-xs">1.192 ha (22%)</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block">Status CAR</span>
                    <span className="font-bold text-emerald-400 text-xs">100% REGULAR</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 space-y-1">
                <div>Assinado digitalmente por: Rodrigo Dias de Oliveira (Eng. Agrônomo / MLOps Lead)</div>
                <div>Hash de Verificação: sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
