import React, { useState, useMemo } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { 
  TEMPORAL_HIERARCHY, 
  TemporalRegion, 
  TemporalYearData, 
  Continent, 
  Country 
} from '../data/temporalData';
import { 
  Clock, 
  TrendingUp, 
  Calendar, 
  ShieldCheck, 
  ArrowRight, 
  Globe2, 
  MapPin, 
  BarChart3, 
  Layers, 
  Droplets, 
  Trees, 
  Wheat, 
  Sprout, 
  Mountain, 
  Download, 
  Activity, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

export const TimeSeriesView: React.FC = () => {
  const { language, t } = useLanguage();

  // Hierarchy Selection State
  const [selectedContinentId, setSelectedContinentId] = useState<string>('south_america');
  const [selectedCountryId, setSelectedCountryId] = useState<string>('brazil');
  const [selectedRegionId, setSelectedRegionId] = useState<string>('br_sorriso');

  // Year State (2020 to 2025)
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [compareYear, setCompareYear] = useState<number>(2020);

  // Derived Hierarchy
  const currentContinent = useMemo(() => {
    return TEMPORAL_HIERARCHY.find(c => c.id === selectedContinentId) || TEMPORAL_HIERARCHY[0];
  }, [selectedContinentId]);

  const availableCountries = currentContinent.countries;

  const currentCountry = useMemo(() => {
    return availableCountries.find(c => c.id === selectedCountryId) || availableCountries[0];
  }, [availableCountries, selectedCountryId]);

  const availableRegions = currentCountry.regions;

  const currentRegion = useMemo(() => {
    return availableRegions.find(r => r.id === selectedRegionId) || availableRegions[0];
  }, [availableRegions, selectedRegionId]);

  // Handlers for hierarchical changes
  const handleContinentChange = (continentId: string) => {
    setSelectedContinentId(continentId);
    const continent = TEMPORAL_HIERARCHY.find(c => c.id === continentId) || TEMPORAL_HIERARCHY[0];
    const firstCountry = continent.countries[0];
    setSelectedCountryId(firstCountry.id);
    setSelectedRegionId(firstCountry.regions[0].id);
  };

  const handleCountryChange = (countryId: string) => {
    setSelectedCountryId(countryId);
    const country = availableCountries.find(c => c.id === countryId) || availableCountries[0];
    setSelectedRegionId(country.regions[0].id);
  };

  const handleRegionChange = (regionId: string) => {
    setSelectedRegionId(regionId);
  };

  // Year data
  const currentYearData: TemporalYearData = currentRegion.years[selectedYear] || currentRegion.years[2025];
  const baseYearData: TemporalYearData = currentRegion.years[compareYear] || currentRegion.years[2020];

  // Deltas for the 5 categories (Year selected vs Compare Year)
  const cropsDelta = Number((currentYearData.cropsPct - baseYearData.cropsPct).toFixed(1));
  const pastureDelta = Number((currentYearData.pasturePct - baseYearData.pasturePct).toFixed(1));
  const waterDelta = Number((currentYearData.waterPct - baseYearData.waterPct).toFixed(1));
  const forestDelta = Number((currentYearData.forestPct - baseYearData.forestPct).toFixed(1));
  const reforestationDelta = Number((currentYearData.reforestationPct - baseYearData.reforestationPct).toFixed(1));

  // The 5 Mandatory Categories
  const CATEGORIES = [
    {
      id: 'crops',
      number: 1,
      name: 'Lavouras',
      sublabel: 'Agricultura Anual (Grãos, Soja, Milho, Algodão)',
      pct: currentYearData.cropsPct,
      basePct: baseYearData.cropsPct,
      delta: cropsDelta,
      color: '#eab308',
      bgClass: 'bg-yellow-500',
      textClass: 'text-yellow-400',
      icon: Wheat,
    },
    {
      id: 'pasture',
      number: 2,
      name: 'Pastagens',
      sublabel: 'Pastagens Cultivadas e Manejadas',
      pct: currentYearData.pasturePct,
      basePct: baseYearData.pasturePct,
      delta: pastureDelta,
      color: '#84cc16',
      bgClass: 'bg-lime-500',
      textClass: 'text-lime-400',
      icon: Sprout,
    },
    {
      id: 'water',
      number: 3,
      name: 'Recursos Hídricos',
      sublabel: 'Rios, Lagos, Represas e Nascentes',
      pct: currentYearData.waterPct,
      basePct: baseYearData.waterPct,
      delta: waterDelta,
      color: '#0ea5e9',
      bgClass: 'bg-sky-500',
      textClass: 'text-sky-400',
      icon: Droplets,
    },
    {
      id: 'forest',
      number: 4,
      name: 'Floresta',
      sublabel: 'Vegetação Nativa e Floresta Primária / Dossel Denso',
      pct: currentYearData.forestPct,
      basePct: baseYearData.forestPct,
      delta: forestDelta,
      color: '#10b981',
      bgClass: 'bg-emerald-500',
      textClass: 'text-emerald-400',
      icon: Trees,
    },
    {
      id: 'reforestation',
      number: 5,
      name: 'Reflorestamento',
      sublabel: 'Florestas Plantadas, Restauração Ecológica e Silvicultura',
      pct: currentYearData.reforestationPct,
      basePct: baseYearData.reforestationPct,
      delta: reforestationDelta,
      color: '#06b6d4',
      bgClass: 'bg-cyan-500',
      textClass: 'text-cyan-400',
      icon: Mountain,
    },
  ];

  // Export CSV Handler
  const handleExportCsv = () => {
    let csvContent = "data:text/csv;charset=utf-8,Ano,Lavouras_Pct,Pastagens_Pct,Recursos_Hidricos_Pct,Floresta_Pct,Reflorestamento_Pct,NDVI_Medio,Estoque_Carbono_TonsHa,Alertas_Desmate_Ha\n";
    [2020, 2021, 2022, 2023, 2024, 2025].forEach(y => {
      const d = currentRegion.years[y];
      if (d) {
        csvContent += `${d.year},${d.cropsPct},${d.pasturePct},${d.waterPct},${d.forestPct},${d.reforestationPct},${d.ndviMean},${d.carbonStockTonsHa},${d.lossAlertHectares}\n`;
      }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `evolucao_temporal_${currentRegion.id}_2020_2025.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-6 h-6" />
            </span>
            Detecção de Mudança Temporal do Uso do Solo (2020 a 2025)
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-1 max-w-3xl">
            Monitoramento de séries temporais multiespectrais por Continente, País e Região, rastreando as 5 classes primordiais de cobertura do solo.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-all cursor-pointer shadow-sm self-start md:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Exportar Série Histórica (CSV)</span>
        </button>
      </div>

      {/* 1. HIERARCHICAL GEOGRAPHIC SELECTION (Continente, País, Região) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
            <Globe2 className="w-4 h-4 text-emerald-400" />
            <span>Filtro Geográfico Hierárquico</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Resolução Espacial: 10m Sentinel-2 / Landsat-8 Harmonizado
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Continente */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <span>Continente</span>
            </label>
            <select
              id="select-temporal-continent"
              value={selectedContinentId}
              onChange={(e) => handleContinentChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 transition-colors"
            >
              {TEMPORAL_HIERARCHY.map(cont => (
                <option key={cont.id} value={cont.id}>
                  {cont.icon} {cont.name}
                </option>
              ))}
            </select>
          </div>

          {/* País */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <span>País</span>
            </label>
            <select
              id="select-temporal-country"
              value={selectedCountryId}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 transition-colors"
            >
              {availableCountries.map(country => (
                <option key={country.id} value={country.id}>
                  {country.flag} {country.name}
                </option>
              ))}
            </select>
          </div>

          {/* Região */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              <span>Região Monitorada</span>
            </label>
            <select
              id="select-temporal-region"
              value={selectedRegionId}
              onChange={(e) => handleRegionChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 transition-colors"
            >
              {availableRegions.map(reg => (
                <option key={reg.id} value={reg.id}>
                  {reg.name} ({reg.stateOrProvince})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Region Snapshot Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>{currentRegion.name}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {currentRegion.biome}
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              {currentRegion.historicalSummary}
            </p>
          </div>
          <div className="text-right shrink-0 space-y-0.5 font-mono text-xs">
            <div className="text-slate-400">Área Amostral Monitorada</div>
            <div className="text-emerald-400 font-bold text-sm">
              {currentRegion.totalHectares.toLocaleString('pt-BR')} ha
            </div>
          </div>
        </div>
      </div>

      {/* 2. YEAR SELECTOR: 2020 a 2025 */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">
              Ano em Análise: <strong className="text-amber-400 text-lg font-mono">{selectedYear}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Comparar com ano-base:</span>
            <select
              value={compareYear}
              onChange={(e) => setCompareYear(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 font-mono text-xs"
            >
              {[2020, 2021, 2022, 2023, 2024, 2025].map(y => (
                <option key={y} value={y} disabled={y === selectedYear}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 2020 a 2025 Buttons Strip */}
        <div className="grid grid-cols-6 gap-2 sm:gap-3">
          {[2020, 2021, 2022, 2023, 2024, 2025].map(year => {
            const isSelected = selectedYear === year;
            const isCompare = compareYear === year;
            return (
              <button
                key={year}
                id={`btn-temporal-year-${year}`}
                onClick={() => setSelectedYear(year)}
                className={`py-3.5 px-2 rounded-xl text-center transition-all border cursor-pointer relative ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20 font-extrabold scale-105 z-10'
                    : isCompare
                    ? 'bg-slate-800/80 text-sky-300 border-sky-500/50 font-bold'
                    : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200 font-semibold'
                }`}
              >
                <div className="text-base font-mono">{year}</div>
                {isSelected && (
                  <div className="text-[10px] font-sans font-bold tracking-tight uppercase mt-0.5">Ativo</div>
                )}
                {isCompare && !isSelected && (
                  <div className="text-[9px] font-mono text-sky-400 uppercase mt-0.5">Base</div>
                )}
              </button>
            );
          })}
        </div>

        <div className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
          <span>{currentYearData.notes}</span>
          <span className="font-mono text-emerald-400 font-bold">NDVI Médio: {currentYearData.ndviMean}</span>
        </div>
      </div>

      {/* 3. AS 5 CLASSES DE COBERTURA DO SOLO: Lavouras, Pastagens, Recursos Hídricos, Floresta, Reflorestamento */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Evolução Temporal de Cobertura do Solo (5 Classes Obrigatórias)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Balanço quantitativo de hectares e variação líquida entre {compareYear} e {selectedYear}.
            </p>
          </div>

          <span className="text-xs font-mono text-slate-400 px-3 py-1 rounded-lg bg-slate-950 border border-slate-800">
            Total da Área: {currentRegion.totalHectares.toLocaleString('pt-BR')} ha
          </span>
        </div>

        {/* 5 Cards for the 5 Categories */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const hectares = Math.round((cat.pct / 100) * currentRegion.totalHectares);
            const isPositive = cat.delta >= 0;

            return (
              <div 
                key={cat.id} 
                className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-slate-700 transition-all shadow-md"
              >
                {/* Accent top line */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1" 
                  style={{ backgroundColor: cat.color }} 
                />

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                      {cat.number}
                    </span>
                    <Icon className={`w-4 h-4 ${cat.textClass}`} />
                  </div>

                  <h3 className="text-sm font-bold text-white mt-1.5">{cat.name}</h3>
                  <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">
                    {cat.sublabel}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="flex items-baseline justify-between">
                    <span className={`text-2xl font-black font-mono ${cat.textClass}`}>
                      {cat.pct}%
                    </span>
                    <span className="text-xs font-mono text-slate-300 font-semibold">
                      {hectares.toLocaleString('pt-BR')} ha
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${cat.bgClass}`}
                      style={{ width: `${Math.min(100, cat.pct)}%` }}
                    />
                  </div>

                  {/* Delta compared to compareYear */}
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-500">vs {compareYear}:</span>
                    <span className={`font-bold ${
                      cat.delta === 0 ? 'text-slate-400' :
                      cat.id === 'forest' || cat.id === 'reforestation' || cat.id === 'water'
                        ? (cat.delta > 0 ? 'text-emerald-400' : 'text-rose-400')
                        : (cat.delta > 0 ? 'text-yellow-400' : 'text-slate-400')
                    }`}>
                      {isPositive ? `+${cat.delta}%` : `${cat.delta}%`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Multi-Year Stacked Evolution Bar (2020 a 2025) */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Composição Comparativa Anual (2020 a 2025)</span>
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> 1 Lavouras</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-lime-500" /> 2 Pastagens</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500" /> 3 Hídricos</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> 4 Floresta</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-500" /> 5 Reflorestamento</span>
            </div>
          </div>

          <div className="space-y-2">
            {[2020, 2021, 2022, 2023, 2024, 2025].map(y => {
              const d = currentRegion.years[y];
              const isSelected = selectedYear === y;
              return (
                <div key={y} className={`p-2 rounded-lg transition-all ${isSelected ? 'bg-slate-900 ring-1 ring-amber-500/40' : ''}`}>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                    <span className={isSelected ? 'text-amber-400 font-bold' : ''}>Ano {y}</span>
                    <span>NDVI: {d.ndviMean} • Carbono: {d.carbonStockTonsHa} t/ha</span>
                  </div>
                  <div className="h-3.5 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
                    <div style={{ width: `${d.cropsPct}%` }} className="bg-yellow-500 h-full" title={`1 Lavouras: ${d.cropsPct}%`} />
                    <div style={{ width: `${d.pasturePct}%` }} className="bg-lime-500 h-full" title={`2 Pastagens: ${d.pasturePct}%`} />
                    <div style={{ width: `${d.waterPct}%` }} className="bg-sky-500 h-full" title={`3 Recursos Hídricos: ${d.waterPct}%`} />
                    <div style={{ width: `${d.forestPct}%` }} className="bg-emerald-500 h-full" title={`4 Floresta: ${d.forestPct}%`} />
                    <div style={{ width: `${d.reforestationPct}%` }} className="bg-cyan-500 h-full" title={`5 Reflorestamento: ${d.reforestationPct}%`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Environmental Balance & Deforestation Zero Alerts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Conformidade Florestal & Desmatamento Zero (2020-2025)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              O monitoramento temporal por radar Sentinel-1 e óptico Sentinel-2 confirma estabilidade das áreas de preservação permanente (APP) e reserva legal (RL), com desmatamento residual reduzido para {currentYearData.lossAlertHectares} ha em {selectedYear}.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Balanço Líquido de Reflorestamento e Carbono</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              A classe de Reflorestamento evoluiu de {baseYearData.reforestationPct}% ({compareYear}) para {currentYearData.reforestationPct}% ({selectedYear}), adicionando {(Math.round((reforestationDelta / 100) * currentRegion.totalHectares)).toLocaleString('pt-BR')} ha recuperados e elevando o estoque de carbono para {currentYearData.carbonStockTonsHa} t/ha.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
