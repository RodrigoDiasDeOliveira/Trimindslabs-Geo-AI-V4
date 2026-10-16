import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getSavedAnalyses } from '../utils/analysisStorage';
import { SavedAreaAnalysis } from '../types';
import { FileText, Download, ShieldCheck, AlertTriangle, Lock, FileCheck } from 'lucide-react';

type ReportType = 'analysis_summary' | 'car_indicator' | 'carbon_estimate' | 'time_series';

const formatNumber = (value: number | undefined): string =>
  typeof value === 'number' && Number.isFinite(value)
    ? value.toLocaleString('pt-BR', { maximumFractionDigits: 3 })
    : 'Não informado';

export const ReportsManagementView: React.FC = () => {
  const { isAdmin } = useAuth();
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAreaAnalysis[]>([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState('');
  const [reportType, setReportType] = useState<ReportType>('analysis_summary');
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const [generatedFilename, setGeneratedFilename] = useState<string | null>(null);

  useEffect(() => {
    const list = getSavedAnalyses();
    setSavedAnalyses(list);
    setSelectedAnalysisId(list[0]?.id || '');
  }, []);

  const selectedAnalysis = savedAnalyses.find((analysis) => analysis.id === selectedAnalysisId) || null;

  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center space-y-4">
        <Lock className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Acesso restrito ao perfil administrador</h2>
        <p className="text-sm text-slate-400">
          A geração e exportação de relatórios é restrita a administradores.
        </p>
      </div>
    );
  }

  const handleGenerateReport = () => {
    if (!selectedAnalysis) return;
    if (reportType === 'time_series') return;

    const analysis = selectedAnalysis;
    const lines = [
      'TRIMINDS GEO AI — RELATÓRIO DE DADOS DE ANÁLISE',
      'Documento informativo gerado a partir de um registro salvo.',
      'Este documento não é certificação legal nem comprova, por si só, conformidade ambiental.',
      '',
      '1. IDENTIFICAÇÃO',
      `Título do laudo: ${analysis.title}`,
      `Identificador do registro: ${analysis.id}`,
      `Propriedade / talhão: ${analysis.farmName}`,
      `Região: ${analysis.region}`,
      `Bioma informado: ${analysis.biome}`,
      `Centro (WGS84): latitude ${analysis.center.lat}, longitude ${analysis.center.lng}`,
      `BBox (WGS84): [${analysis.bbox.join(', ')}]`,
      `Área registrada: ${formatNumber(analysis.areaHectares)} ha`,
      `Modelo/identificador registrado: ${analysis.selectedModel || 'Não informado'}`,
      `Data do registro: ${analysis.createdAt || 'Não informada'}`,
      '',
      '2. MÉTRICAS REGISTRADAS',
      `NDVI médio: ${formatNumber(analysis.results.meanNdvi)}`,
      `NDRE médio: ${formatNumber(analysis.results.meanNdre)}`,
      `Estoque de carbono estimado: ${formatNumber(analysis.results.carbonStockTon)} tCO2e`,
      `Indicador CAR armazenado: ${analysis.results.carStatus || 'Não informado'}`,
      '',
      '3. DISTRIBUIÇÃO DE CLASSES REGISTRADA',
      ...(analysis.results.classBreakdown.length
        ? analysis.results.classBreakdown.map((item) =>
            `- ${item.className}: ${formatNumber(item.hectares)} ha (${formatNumber(item.percentage)}%)`
          )
        : ['Não há distribuição de classes armazenada neste registro.']),
      '',
      '4. LIMITAÇÕES E RASTREABILIDADE',
      'Os valores acima foram transcritos do registro selecionado; não foram recalculados nem validados independentemente por este exportador.',
      'A indicação CAR é um indicador computacional armazenado, não uma certificação jurídica.',
      'Não foram inferidos dados de APP, desmatamento histórico, acurácia de modelo ou série temporal quando não estão presentes no registro.',
      `Anotações do registro: ${analysis.notes || 'Nenhuma anotação armazenada.'}`,
      '',
      `Emitido em: ${new Date().toLocaleString('pt-BR')}`
    ];

    if (reportType === 'car_indicator') {
      lines.splice(4, 0, 'Tipo de relatório: INDICADOR AMBIENTAL / CAR');
    } else if (reportType === 'carbon_estimate') {
      lines.splice(4, 0, 'Tipo de relatório: ESTIMATIVA DE CARBONO');
    } else {
      lines.splice(4, 0, 'Tipo de relatório: RESUMO DA ANÁLISE');
    }

    const filename = `triminds-relatorio-${reportType}-${analysis.id.replace(/[^a-zA-Z0-9_-]/g, '_')}-${new Date().toISOString().slice(0, 10)}.txt`;
    setGeneratedReport(lines.join('\n'));
    setGeneratedFilename(filename);
  };

  const handleDownloadReport = () => {
    if (!generatedReport || !generatedFilename) return;
    const blob = new Blob([generatedReport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = generatedFilename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-bold tracking-wider uppercase mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Relatórios conduzidos pela auditoria</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Relatórios de análises registradas</h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Os documentos usam dados da biblioteca salva. Métricas ausentes não são inventadas e o arquivo exportado é identificado como texto (.txt).
          </p>
        </div>
        <span className="text-xs px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/30 font-mono font-bold">
          Perfil administrador
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-purple-400" />
              Fonte e tipo do relatório
            </h2>

            <div className="space-y-1.5">
              <label htmlFor="report-analysis-select" className="text-xs font-bold text-slate-300">Análise salva</label>
              <select
                id="report-analysis-select"
                value={selectedAnalysisId}
                onChange={(event) => {
                  setSelectedAnalysisId(event.target.value);
                  setGeneratedReport(null);
                  setGeneratedFilename(null);
                }}
                disabled={savedAnalyses.length === 0}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
              >
                {savedAnalyses.length === 0 && <option value="">Nenhuma análise salva</option>}
                {savedAnalyses.map((analysis) => (
                  <option key={analysis.id} value={analysis.id}>
                    {analysis.title} — {analysis.region}
                  </option>
                ))}
              </select>
              {savedAnalyses.length === 0 && (
                <p className="text-xs text-amber-300 mt-2">Salve uma análise na biblioteca antes de gerar um relatório.</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Tipo de relatório</label>
              {[
                { id: 'analysis_summary', title: 'Resumo da análise', desc: 'Identificação, métricas e classes armazenadas.' },
                { id: 'car_indicator', title: 'Indicador ambiental / CAR', desc: 'Exibe somente o indicador CAR registrado e suas limitações.' },
                { id: 'carbon_estimate', title: 'Estimativa de carbono', desc: 'Exibe o valor estimado armazenado, sem alegar certificação.' },
                { id: 'time_series', title: 'Série temporal', desc: 'Indisponível: o registro não armazena uma série temporal verificável.' }
              ].map((template) => (
                <button
                  key={template.id}
                  type="button"
                  disabled={template.id === 'time_series'}
                  onClick={() => {
                    setReportType(template.id as ReportType);
                    setGeneratedReport(null);
                    setGeneratedFilename(null);
                  }}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    reportType === template.id
                      ? 'bg-purple-500/15 border-purple-500/60 ring-1 ring-purple-500/40 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-200">{template.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{template.desc}</div>
                </button>
              ))}
            </div>

            <button
              id="btn-generate-report"
              type="button"
              onClick={handleGenerateReport}
              disabled={!selectedAnalysis || reportType === 'time_series'}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-purple-500 hover:bg-purple-400 text-slate-950 flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FileText className="w-4 h-4" />
              <span>Gerar relatório a partir dos dados</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Pré-visualização do documento</h3>
              {generatedReport && generatedFilename && (
                <button
                  id="btn-download-report"
                  type="button"
                  onClick={handleDownloadReport}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-400 hover:bg-emerald-300 text-slate-950 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar .txt</span>
                </button>
              )}
            </div>

            {!generatedReport ? (
              <div className="min-h-64 flex flex-col items-center justify-center text-center gap-3 text-slate-400">
                <FileText className="w-10 h-10 text-slate-600" />
                <p className="text-sm">Selecione uma análise salva e gere o documento para visualizar os dados reais registrados.</p>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap break-words bg-slate-950 border border-slate-800 rounded-2xl p-5 text-xs text-slate-300 leading-relaxed font-mono overflow-x-auto">
                {generatedReport}
              </pre>
            )}

            <div className="flex items-start gap-2 p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-[11px] text-amber-200">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>O exportador não calcula nem autentica resultados novos. Não apresenta assinatura criptográfica, F1, acurácia ou conformidade legal sem evidência armazenada.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
