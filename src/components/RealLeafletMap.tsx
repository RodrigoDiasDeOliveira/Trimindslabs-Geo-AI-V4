import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, Maximize2, MapPin, Eye, Sliders, RefreshCw, Square, Pentagon, Trash2 } from 'lucide-react';
import { GeoJSONFeatureCollection } from '../../server/types';

export interface MapCoords {
  lat: number;
  lng: number;
}

export interface RealLeafletMapProps {
  center: MapCoords;
  zoom?: number;
  bbox?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  polygonCoords?: number[][]; // [ [lng, lat], ... ]
  onRoiChange?: (bbox: [number, number, number, number], polygon: number[][], areaHa: number) => void;
  lulcGeoJson?: GeoJSONFeatureCollection | null;
  activeLayer?: 'satellite' | 'lulc' | 'ndvi';
  overlayOpacity?: number;
  isDrawingMode?: 'box' | 'polygon' | null;
  onDrawingModeChange?: (mode: 'box' | 'polygon' | null) => void;
}

const TILE_LAYERS = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19
  },
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  },
  topo: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Kartendaten: &copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Kartendarstellung: &copy; <a href="http://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17
  }
};

/**
 * Calculates geodesic polygon area on Earth's surface in square meters
 */
function getSphericalAreaMeters(latLngs: L.LatLng[]): number {
  if (latLngs.length < 3) return 0;
  const radius = 6371008.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  let total = 0;
  const len = latLngs.length;

  for (let i = 0; i < len; i++) {
    const p1 = latLngs[i];
    const p2 = latLngs[(i + 1) % len];
    const p3 = latLngs[(i + 2) % len];

    const lat1 = toRad(p1.lat);
    const lon1 = toRad(p1.lng);
    const lat2 = toRad(p2.lat);
    const lon2 = toRad(p2.lng);
    const lat3 = toRad(p3.lat);
    const lon3 = toRad(p3.lng);

    const y1 = Math.sin(lon1 - lon2) * Math.cos(lat1);
    const x1 = Math.cos(lat2) * Math.sin(lat1) - Math.sin(lat2) * Math.cos(lat1) * Math.cos(lon1 - lon2);
    const b1 = Math.atan2(y1, x1);

    const y2 = Math.sin(lon3 - lon2) * Math.cos(lat3);
    const x2 = Math.cos(lat2) * Math.sin(lat3) - Math.sin(lat2) * Math.cos(lat3) * Math.cos(lon3 - lon2);
    const b2 = Math.atan2(y2, x2);

    let angle = b2 - b1;
    while (angle <= -Math.PI) angle += 2 * Math.PI;
    while (angle > Math.PI) angle -= 2 * Math.PI;
    total += angle;
  }

  return Math.abs(total) * radius * radius;
}

export const RealLeafletMap: React.FC<RealLeafletMapProps> = ({
  center,
  zoom = 12,
  bbox,
  polygonCoords,
  onRoiChange,
  lulcGeoJson,
  activeLayer = 'satellite',
  overlayOpacity = 0.75,
  isDrawingMode = null,
  onDrawingModeChange
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const roiLayerRef = useRef<L.LayerGroup | null>(null);
  const lulcLayerRef = useRef<L.GeoJSON | null>(null);

  const [selectedBasemap, setSelectedBasemap] = useState<'satellite' | 'osm' | 'topo'>('satellite');
  const [cursorPos, setCursorPos] = useState<{ lat: number; lng: number } | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(zoom);
  const [drawingPoints, setDrawingPoints] = useState<L.LatLng[]>([]);
  const [localOpacity, setLocalOpacity] = useState<number>(overlayOpacity);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [center.lat, center.lng],
        zoom: zoom,
        zoomControl: false,
        attributionControl: false
      });

      // Custom zoom control in bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Attribution
      L.control.attribution({ position: 'bottomleft', prefix: 'Triminds GeoAI' }).addTo(map);

      // Scale control
      L.control.scale({ imperial: false, metric: true, position: 'bottomleft' }).addTo(map);

      // Default Basemap
      const baseCfg = TILE_LAYERS.satellite;
      const tile = L.tileLayer(baseCfg.url, {
        maxZoom: baseCfg.maxZoom,
        attribution: baseCfg.attribution
      }).addTo(map);

      tileLayerRef.current = tile;

      // Group for ROI Rectangles & Polygons
      const roiGroup = L.layerGroup().addTo(map);
      roiLayerRef.current = roiGroup;

      map.on('mousemove', (e: L.LeafletMouseEvent) => {
        setCursorPos({
          lat: Number(e.latlng.lat.toFixed(5)),
          lng: Number(e.latlng.lng.toFixed(5))
        });
      });

      map.on('zoomend', () => {
        setCurrentZoom(map.getZoom());
      });

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Basemap tile layer when changed
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const cfg = TILE_LAYERS[selectedBasemap];
    const newTile = L.tileLayer(cfg.url, {
      maxZoom: cfg.maxZoom,
      attribution: cfg.attribution
    }).addTo(map);

    tileLayerRef.current = newTile;
    newTile.bringToBack();
  }, [selectedBasemap]);

  // Handle map center fly-to when preset center updates
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo([center.lat, center.lng], zoom, { duration: 1.2 });
  }, [center.lat, center.lng, zoom]);

  // Update ROI display (Bounding box or polygon)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const roiGroup = roiLayerRef.current;
    if (!map || !roiGroup) return;

    roiGroup.clearLayers();

    if (polygonCoords && polygonCoords.length >= 3) {
      const latLngs = polygonCoords.map(pt => L.latLng(pt[1], pt[0]));
      const poly = L.polygon(latLngs, {
        color: '#10b981',
        weight: 3,
        fillColor: '#10b981',
        fillOpacity: 0.15,
        dashArray: '4, 4'
      });
      roiGroup.addLayer(poly);
    } else if (bbox) {
      const [minLng, minLat, maxLng, maxLat] = bbox;
      const bounds = L.latLngBounds([minLat, minLng], [maxLat, maxLng]);
      const rect = L.rectangle(bounds, {
        color: '#10b981',
        weight: 2.5,
        fillColor: '#10b981',
        fillOpacity: 0.12,
        dashArray: '5, 5'
      });
      roiGroup.addLayer(rect);
    }
  }, [bbox, polygonCoords]);

  // Render LULC vector classification polygons with color-coded styles and popups
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (lulcLayerRef.current) {
      map.removeLayer(lulcLayerRef.current);
      lulcLayerRef.current = null;
    }

    if (lulcGeoJson && lulcGeoJson.features && lulcGeoJson.features.length > 0) {
      const geoLayer = L.geoJSON(lulcGeoJson as any, {
        style: (feature) => {
          const props = feature?.properties || {};
          const color = props.color || '#10b981';
          return {
            color: color,
            weight: 1.5,
            fillColor: color,
            fillOpacity: localOpacity,
            opacity: 0.85
          };
        },
        onEachFeature: (feature, layer) => {
          const p = feature.properties || {};
          const popupContent = `
            <div class="font-sans text-xs p-1 space-y-1 text-slate-900">
              <div class="font-bold text-sm border-b pb-1" style="color: ${p.color || '#000'}">${p.className || 'Classe LULC'}</div>
              <div><strong>Área:</strong> ${p.hectares ? p.hectares.toLocaleString('pt-BR') : '-'} ha</div>
              <div><strong>Pixels:</strong> ${p.pixels ? p.pixels.toLocaleString('pt-BR') : '-'}</div>
              <div><strong>NDVI Médio:</strong> ${p.meanNdvi ?? '-'}</div>
            </div>
          `;
          layer.bindPopup(popupContent);
        }
      }).addTo(map);

      lulcLayerRef.current = geoLayer;

      // Fit bounds to classification if available
      try {
        const bounds = geoLayer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [30, 30] });
        }
      } catch {}
    }
  }, [lulcGeoJson, localOpacity]);

  // Interactive Drawing Mode Handling
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!isDrawingMode) {
      map.getContainer().style.cursor = '';
      return;
    }

    map.getContainer().style.cursor = 'crosshair';

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const clicked = e.latlng;

      if (isDrawingMode === 'box') {
        if (drawingPoints.length === 0) {
          setDrawingPoints([clicked]);
        } else {
          const p1 = drawingPoints[0];
          const p2 = clicked;
          const minLng = Number(Math.min(p1.lng, p2.lng).toFixed(5));
          const maxLng = Number(Math.max(p1.lng, p2.lng).toFixed(5));
          const minLat = Number(Math.min(p1.lat, p2.lat).toFixed(5));
          const maxLat = Number(Math.max(p1.lat, p2.lat).toFixed(5));

          const newBbox: [number, number, number, number] = [minLng, minLat, maxLng, maxLat];
          const polyCoords = [
            [minLng, minLat],
            [maxLng, minLat],
            [maxLng, maxLat],
            [minLng, maxLat],
            [minLng, minLat]
          ];

          const boxCorners = [
            L.latLng(minLat, minLng),
            L.latLng(minLat, maxLng),
            L.latLng(maxLat, maxLng),
            L.latLng(maxLat, minLng)
          ];
          const areaSqM = getSphericalAreaMeters(boxCorners);
          const areaHa = Number((areaSqM / 10000).toFixed(2));

          onRoiChange?.(newBbox, polyCoords, areaHa);
          setDrawingPoints([]);
          onDrawingModeChange?.(null);
        }
      } else if (isDrawingMode === 'polygon') {
        const nextPoints = [...drawingPoints, clicked];
        setDrawingPoints(nextPoints);

        // Check if closed by clicking near first point
        if (nextPoints.length >= 3) {
          const first = nextPoints[0];
          const dist = map.distance(clicked, first);
          if (dist < 50 && nextPoints.length >= 4) {
            // Close polygon
            const coords = nextPoints.map(p => [Number(p.lng.toFixed(5)), Number(p.lat.toFixed(5))]);
            coords.push([Number(first.lng.toFixed(5)), Number(first.lat.toFixed(5))]);

            let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
            nextPoints.forEach(p => {
              if (p.lng < minLng) minLng = p.lng;
              if (p.lng > maxLng) maxLng = p.lng;
              if (p.lat < minLat) minLat = p.lat;
              if (p.lat > maxLat) maxLat = p.lat;
            });

            const newBbox: [number, number, number, number] = [
              Number(minLng.toFixed(5)),
              Number(minLat.toFixed(5)),
              Number(maxLng.toFixed(5)),
              Number(maxLat.toFixed(5))
            ];
            const areaHa = Number((getSphericalAreaMeters(nextPoints) / 10000).toFixed(2));

            onRoiChange?.(newBbox, coords, areaHa);
            setDrawingPoints([]);
            onDrawingModeChange?.(null);
          }
        }
      }
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [isDrawingMode, drawingPoints, onRoiChange, onDrawingModeChange]);

  const handleClearRoi = () => {
    setDrawingPoints([]);
    onDrawingModeChange?.(null);
    const roiGroup = roiLayerRef.current;
    if (roiGroup) roiGroup.clearLayers();
    if (lulcLayerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(lulcLayerRef.current);
      lulcLayerRef.current = null;
    }
  };

  const handleFitToBbox = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (bbox) {
      map.fitBounds([
        [bbox[1], bbox[0]],
        [bbox[3], bbox[2]]
      ], { padding: [40, 40] });
    } else {
      map.flyTo([center.lat, center.lng], 13);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[520px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[520px] z-0" />

      {/* Top Floating Controls Bar */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-2">
        {/* Basemap Switcher */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 flex items-center shadow-lg">
          <button
            type="button"
            id="btn-basemap-satellite"
            onClick={() => setSelectedBasemap('satellite')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedBasemap === 'satellite'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            🛰️ Satélite
          </button>
          <button
            type="button"
            id="btn-basemap-osm"
            onClick={() => setSelectedBasemap('osm')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedBasemap === 'osm'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            🗺️ Vetorial
          </button>
          <button
            type="button"
            id="btn-basemap-topo"
            onClick={() => setSelectedBasemap('topo')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedBasemap === 'topo'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            ⛰️ Relevo
          </button>
        </div>

        {/* ROI Draw Buttons */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 flex items-center gap-1 shadow-lg">
          <button
            type="button"
            id="btn-draw-box"
            onClick={() => onDrawingModeChange?.(isDrawingMode === 'box' ? null : 'box')}
            title="Desenhar Bounding Box Retangular no mapa"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isDrawingMode === 'box'
                ? 'bg-amber-500 text-slate-950 shadow-sm ring-1 ring-amber-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span>Retângulo</span>
          </button>

          <button
            type="button"
            id="btn-draw-polygon"
            onClick={() => onDrawingModeChange?.(isDrawingMode === 'polygon' ? null : 'polygon')}
            title="Desenhar Polígono Livre no mapa (clique nos vértices)"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isDrawingMode === 'polygon'
                ? 'bg-amber-500 text-slate-950 shadow-sm ring-1 ring-amber-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Pentagon className="w-3.5 h-3.5" />
            <span>Polígono</span>
          </button>

          <button
            type="button"
            id="btn-fit-bbox"
            onClick={handleFitToBbox}
            title="Centralizar no ROI selecionado"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            id="btn-clear-roi"
            onClick={handleClearRoi}
            title="Limpar seleção de ROI"
            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* LULC Opacity Slider (if classification active) */}
        {lulcGeoJson && (
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-lg text-xs text-slate-300">
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>Opacidade LULC:</span>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={localOpacity}
              onChange={(e) => setLocalOpacity(parseFloat(e.target.value))}
              className="w-16 accent-emerald-500 cursor-pointer"
            />
            <span className="font-mono text-[11px] text-emerald-400">{Math.round(localOpacity * 100)}%</span>
          </div>
        )}
      </div>

      {/* Drawing Mode Helper Banner */}
      {isDrawingMode && (
        <div className="absolute top-16 left-3 right-3 sm:right-auto z-[1000] bg-amber-500/90 backdrop-blur-md text-slate-950 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xl flex items-center justify-between gap-3 animate-pulse">
          <div>
            {isDrawingMode === 'box'
              ? drawingPoints.length === 0
                ? 'Clique no primeiro canto do retângulo no mapa...'
                : 'Clique no canto oposto para fechar o retângulo de ROI.'
              : `Clique nos vértices do talhão (${drawingPoints.length} marcados). Clique no ponto inicial para fechar.`}
          </div>
          <button
            type="button"
            onClick={() => {
              setDrawingPoints([]);
              onDrawingModeChange?.(null);
            }}
            className="px-2 py-0.5 rounded bg-slate-950 text-white text-[10px] font-bold"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Real-time Cursor Coordinates & Zoom HUD (Bottom Center) */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[1000] bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-full px-3.5 py-1 text-[11px] font-mono text-slate-300 flex items-center gap-3 shadow-md pointer-events-none">
        <div className="flex items-center gap-1 text-emerald-400">
          <MapPin className="w-3 h-3" />
          <span>WGS84 EPSG:4326</span>
        </div>
        {cursorPos ? (
          <div>
            Lat: <span className="text-white font-bold">{cursorPos.lat}</span> | Lng:{' '}
            <span className="text-white font-bold">{cursorPos.lng}</span>
          </div>
        ) : (
          <div className="text-slate-500">Mova o cursor sobre o mapa</div>
        )}
        <div className="text-slate-400 border-l border-slate-800 pl-2">
          Zoom: <span className="text-white">{currentZoom}</span>
        </div>
      </div>
    </div>
  );
};
