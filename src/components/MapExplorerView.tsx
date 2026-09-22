import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../auth/AuthContext';
import { LULC_CLASSES, GEO_SAMPLES } from '../data/geoData';
import { 
  Map, 
  Layers, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  Maximize2, 
  Compass, 
  Eye, 
  FileText,
  PieChart,
  Lock
} from 'lucide-react';

interface ParcelCoverage {
  classId: string;
  hectares: number;
  percentage: number;
}

interface MapExplorerViewProps {
  onOpenMapSelector?: () => void;
}

export const MapExplorerView: React.FC<MapExplorerViewProps> = ({ onOpenMapSelector }) => {
  const { language, t } = useLanguage();
  const { isAdmin } = useAuth();
  const [selectedSample, setSelectedSample] = useState(GEO_SAMPLES[0]);
  const [totalHectares, setTotalHectares] = useState<number>(5420);
  const [showSatelliteLayer, setShowSatelliteLayer] = useState<boolean>(true);
  const [showMaskLayer, setShowMaskLayer] = useState<boolean>(true);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  // Computed class breakdown in hectares for this parcel
  const coverageBreakdown: ParcelCoverage[] = [
    { classId: 'AnnualCrop', hectares: 3250, percentage: 60.0 },
    { classId: 'Forest', hectares: 1192, percentage: 22.0 },
    { classId: 'Pasture', hectares: 542, percentage: 10.0 },
    { classId: 'River', hectares: 271, percentage: 5.0 },
    { classId: 'HerbaceousVegetation', hectares: 165, percentage: 3.0 },
  ];

  const handleExportGeoJson = () => {
    const geoJsonData = {
      type: "FeatureCollection",
      crs: { type: "name", properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" } },
      features: [
        {
          type: "Feature",
          properties: {
            parcel_name: selectedSample.name[language],
            total_hectares: totalHectares,
            legal_reserve_compliance: "CONFORME",
            sensor: selectedSample.sensor,
            date_processed: new Date().toISOString(),
            lulc_classes: coverageBreakdown.map(c => ({
              class_id: c.classId,
              hectares: c.hectares,
              percentage: c.percentage
            }))
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [selectedSample.coordinates.bbox[0], selectedSample.coordinates.bbox[1]],
              [selectedSample.coordinates.bbox[2], selectedSample.coordinates.bbox[1]],
              [selectedSample.coordinates.bbox[2], selectedSample.coordinates.bbox[3]],
              [selectedSample.coordinates.bbox[0], selectedSample.coordinates.bbox[3]],
              [selectedSample.coordinates.bbox[0], selectedSample.coordinates.bbox[1]]
            ]]
          }
        }
      ]
    };

    const blob = new Blob([JSON.stringify(geoJsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `triminds-parcel-${selectedSample.id}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Map className="w-6 h-6" />
            </span>
            {t.explorer.title}
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-1 max-w-3xl">
            {t.explorer.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onOpenMapSelector && (
            <button
              id="btn-pick-region-map"
              onClick={onOpenMapSelector}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-950 bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Escolher Área no Mapa (GEE / Maps)</span>
            </button>
          )}

          {isAdmin ? (
            <button
              id="btn-export-geojson"
              onClick={handleExportGeoJson}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>{t.explorer.exportMap}</span>
            </button>
          ) : (
            <div 
              title="Operador não gera relatórios ou exportações. Recurso exclusivo para Administrador."
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs text-slate-500 bg-slate-900 border border-slate-800 cursor-not-allowed opacity-80"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Exportação restrita a Admin</span>
            </div>
          )}
        </div>
      </div>

      {copiedNotification && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>GeoJSON baixado com sucesso contendo polígonos e atributos espectrais.</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Map Viewport Interactive Stage */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            {/* Map Controls Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <select
                  id="select-sample-map"
                  value={selectedSample.id}
                  onChange={(e) => {
                    const found = GEO_SAMPLES.find(s => s.id === e.target.value);
                    if (found) setSelectedSample(found);
                  }}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-emerald-500"
                >
                  {GEO_SAMPLES.map(sample => (
                    <option key={sample.id} value={sample.id}>
                      {sample.name[language]}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                  EPSG:4326 WGS84
                </span>
              </div>

              {/* Layer Toggles */}
              <div className="flex items-center gap-2">
                <button
                  id="toggle-sat-layer"
                  onClick={() => setShowSatelliteLayer(!showSatelliteLayer)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                    showSatelliteLayer 
                      ? 'bg-slate-800 text-slate-200 border-slate-700' 
                      : 'bg-slate-950 text-slate-500 border-slate-800 line-through'
                  }`}
                >
                  RGB Satellite
                </button>
                <button
                  id="toggle-mask-layer"
                  onClick={() => setShowMaskLayer(!showMaskLayer)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                    showMaskLayer 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                      : 'bg-slate-950 text-slate-500 border-slate-800'
                  }`}
                >
                  Máscara de Cobertura do Solo
                </button>
              </div>
            </div>

            {/* Simulated Satellite Stage Canvas */}
            <div className="relative rounded-xl overflow-hidden aspect-[16/10] bg-slate-950 border border-slate-800 flex items-center justify-center">
              {showSatelliteLayer ? (
                <img
                  src={selectedSample.previewUrl}
                  alt={selectedSample.name[language]}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-950 grid grid-cols-8 grid-rows-8 gap-1 p-2 opacity-30">
                  {Array.from({ length: 64 }).map((_, i) => (
                    <div key={i} className="border border-slate-800 rounded"></div>
                  ))}
                </div>
              )}

              {/* Polygon & Segmentation Mask Overlay */}
              {showMaskLayer && (
                <div className="absolute inset-0 p-8 flex items-center justify-center pointer-events-none">
                  <div className="w-3/4 h-3/4 border-2 border-emerald-400 bg-emerald-500/15 rounded-2xl relative shadow-2xl backdrop-blur-[1px]">
                    {/* Bounding box corner badges */}
                    <div className="absolute -top-3 -left-3 bg-emerald-500 text-slate-950 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                      NW: {selectedSample.coordinates.bbox[1].toFixed(2)}, {selectedSample.coordinates.bbox[0].toFixed(2)}
                    </div>
                    <div className="absolute -bottom-3 -right-3 bg-emerald-500 text-slate-950 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                      SE: {selectedSample.coordinates.bbox[3].toFixed(2)}, {selectedSample.coordinates.bbox[2].toFixed(2)}
                    </div>
                    {/* Area tag center */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="bg-slate-950/90 text-white border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg">
                        Talhão Agrícola / Cobertura: 5.420 ha
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Floating Map Compass / Scale */}
              <div className="absolute bottom-3 left-3 bg-slate-950/90 backdrop-blur-sm border border-slate-800 rounded-lg p-2 text-[11px] text-slate-300 flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Compass className="w-4 h-4 text-sky-400" />
                  <span>Norte (0°)</span>
                </div>
                <span className="text-slate-600">|</span>
                <span>Escala 1:25.000 (10m/px)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Hectares Calculation & Environmental Compliance */}
        <div className="lg:col-span-4 space-y-6">
          {/* Hectares Breakdown Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-400" />
                {t.explorer.detectedClasses}
              </h2>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {totalHectares.toLocaleString()} ha Total
              </span>
            </div>

            <div className="space-y-3">
              {coverageBreakdown.map(item => {
                const lulcClass = LULC_CLASSES.find(c => c.id === item.classId);
                if (!lulcClass) return null;
                return (
                  <div key={item.classId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium flex items-center gap-1.5">
                        <span 
                          className="w-2.5 h-2.5 rounded-full" 
                          style={{ backgroundColor: lulcClass.color }}
                        ></span>
                        {lulcClass.name[language]}
                      </span>
                      <div className="font-mono text-right">
                        <span className="text-white font-bold">{item.hectares.toLocaleString()} ha</span>
                        <span className="text-slate-400 text-[11px] ml-1.5">({item.percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: lulcClass.color
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Environmental Compliance (CAR / ESG) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {t.explorer.complianceSummary}
            </h2>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-200">Reserva Legal (Código Florestal)</span>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    {selectedSample.biome[language].includes('Amazônia') 
                      ? 'Exigência de 80% de Reserva Legal preservada.'
                      : 'Exigência de 20% a 35% de cobertura nativa integralmente preservada.'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-200">{t.explorer.waterPreservation}</span>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Margens de cursos hídricos e nascentes devidamente conservadas com vegetação ciliar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
