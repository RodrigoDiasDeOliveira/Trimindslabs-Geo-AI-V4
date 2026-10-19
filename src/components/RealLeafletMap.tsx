import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Layers, 
  Maximize2, 
  MapPin, 
  Eye, 
  Sliders, 
  RefreshCw, 
  Square, 
  Pentagon, 
  Trash2,
  Check,
  RotateCcw,
  Plus,
  Minus,
  Move
} from 'lucide-react';
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
  isDrawingMode?: 'box' | 'pentagon' | 'polygon' | null;
  onDrawingModeChange?: (mode: 'box' | 'pentagon' | 'polygon' | null) => void;
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
  const drawingLayerRef = useRef<L.LayerGroup | null>(null);
  const lulcLayerRef = useRef<L.GeoJSON | null>(null);

  const [selectedBasemap, setSelectedBasemap] = useState<'satellite' | 'osm' | 'topo'>('satellite');
  const [cursorPos, setCursorPos] = useState<{ lat: number; lng: number } | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(zoom);
  const [drawingPoints, setDrawingPoints] = useState<L.LatLng[]>([]);
  const [localOpacity, setLocalOpacity] = useState<number>(overlayOpacity);
  const [formatStepKm, setFormatStepKm] = useState<number>(0.5);
  const [showBboxFormatBar, setShowBboxFormatBar] = useState<boolean>(true);

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
              <div class="font-bold text-sm border-b pb-1" style="color: ${p.color || '#000'}">${p.className || 'Classe de cobertura do solo'}</div>
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

  // Helper: finalize polygon with >= 3 vertices
  const finalizePolygon = (pointsToFinalize?: L.LatLng[]) => {
    const points = pointsToFinalize || drawingPoints;
    if (points.length < 3) return;
    const first = points[0];
    const coords = points.map(p => [Number(p.lng.toFixed(5)), Number(p.lat.toFixed(5))]);
    coords.push([Number(first.lng.toFixed(5)), Number(first.lat.toFixed(5))]);

    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    points.forEach(p => {
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
    const areaHa = Number((getSphericalAreaMeters(points) / 10000).toFixed(2));

    onRoiChange?.(newBbox, coords, areaHa);
    setDrawingPoints([]);
    if (drawingLayerRef.current) {
      drawingLayerRef.current.clearLayers();
    }
    onDrawingModeChange?.(null);
  };

  // Helper: Undo last vertex in polygon or pentagon mode
  const handleUndoVertex = () => {
    setDrawingPoints(prev => prev.slice(0, -1));
  };

  // Helper: Stamp regular pentagon (5 vertices) at map center or specified coordinates
  const handleStampRegularPentagon = (radiusKm = 2.0, targetCenter?: L.LatLng) => {
    const map = mapInstanceRef.current;
    const centerPt = targetCenter || (map ? map.getCenter() : L.latLng(center.lat, center.lng));
    const degLatPerKm = 1 / 110.574;
    const degLngPerKm = 1 / (111.320 * Math.cos((centerPt.lat * Math.PI) / 180));
    const points: L.LatLng[] = [];
    for (let i = 0; i < 5; i++) {
      const angle = (2 * Math.PI * i) / 5 - Math.PI / 2; // North-aligned vertex
      const lat = centerPt.lat + (radiusKm * Math.sin(angle)) * degLatPerKm;
      const lng = centerPt.lng + (radiusKm * Math.cos(angle)) * degLngPerKm;
      points.push(L.latLng(lat, lng));
    }
    finalizePolygon(points);
  };

  // Helper: Adjust any of the 4 sides of the rectangle (North, South, East, West)
  const adjustBboxSide = (side: 'north' | 'south' | 'east' | 'west', direction: 'expand' | 'shrink') => {
    if (!bbox) return;
    const [minLng, minLat, maxLng, maxLat] = bbox;
    const stepKm = formatStepKm;
    const degLatPerKm = stepKm / 111;
    const avgLat = (minLat + maxLat) / 2;
    const degLngPerKm = stepKm / (111 * Math.cos((avgLat * Math.PI) / 180));

    let newMinLng = minLng;
    let newMaxLng = maxLng;
    let newMinLat = minLat;
    let newMaxLat = maxLat;

    if (side === 'north') {
      newMaxLat = direction === 'expand' ? maxLat + degLatPerKm : maxLat - degLatPerKm;
      if (newMaxLat <= newMinLat + 0.005) return;
    } else if (side === 'south') {
      newMinLat = direction === 'expand' ? minLat - degLatPerKm : minLat + degLatPerKm;
      if (newMinLat >= newMaxLat - 0.005) return;
    } else if (side === 'east') {
      newMaxLng = direction === 'expand' ? maxLng + degLngPerKm : maxLng - degLngPerKm;
      if (newMaxLng <= newMinLng + 0.005) return;
    } else if (side === 'west') {
      newMinLng = direction === 'expand' ? minLng - degLngPerKm : minLng + degLngPerKm;
      if (newMinLng >= newMaxLng - 0.005) return;
    }

    const updatedBbox: [number, number, number, number] = [
      Number(newMinLng.toFixed(5)),
      Number(newMinLat.toFixed(5)),
      Number(newMaxLng.toFixed(5)),
      Number(newMaxLat.toFixed(5))
    ];
    const polyCoords = [
      [updatedBbox[0], updatedBbox[1]],
      [updatedBbox[2], updatedBbox[1]],
      [updatedBbox[2], updatedBbox[3]],
      [updatedBbox[0], updatedBbox[3]],
      [updatedBbox[0], updatedBbox[1]]
    ];
    const corners = [
      L.latLng(updatedBbox[1], updatedBbox[0]),
      L.latLng(updatedBbox[1], updatedBbox[2]),
      L.latLng(updatedBbox[3], updatedBbox[2]),
      L.latLng(updatedBbox[3], updatedBbox[0])
    ];
    const areaHa = Number((getSphericalAreaMeters(corners) / 10000).toFixed(2));
    onRoiChange?.(updatedBbox, polyCoords, areaHa);
  };

  // Render in-progress drawing preview (vertices + lines)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!drawingLayerRef.current) {
      drawingLayerRef.current = L.layerGroup().addTo(map);
    }
    const layer = drawingLayerRef.current;
    layer.clearLayers();

    if (drawingPoints.length === 0) return;

    // Draw lines between points
    if (drawingPoints.length > 1) {
      const line = L.polyline(drawingPoints, {
        color: '#f59e0b',
        weight: 3,
        dashArray: '6, 6',
        opacity: 0.9
      });
      layer.addLayer(line);
    }

    // Draw vertex markers
    drawingPoints.forEach((pt, idx) => {
      const isFirst = idx === 0;
      const marker = L.circleMarker(pt, {
        radius: isFirst ? 9 : 6,
        fillColor: isFirst ? '#10b981' : '#f59e0b',
        fillOpacity: 1,
        color: '#0f172a',
        weight: 2
      });

      marker.bindTooltip(
        isFirst 
          ? `Vértice 1 (Ponto Inicial - clique para fechar)` 
          : isDrawingMode === 'pentagon'
          ? `Vértice ${idx + 1} de 5`
          : `Vértice ${idx + 1}`,
        { permanent: false, direction: 'top' }
      );

      if (isFirst && drawingPoints.length >= 3) {
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          finalizePolygon();
        });
      }

      layer.addLayer(marker);
    });
  }, [drawingPoints]);

  // Interactive Drawing Mode Handling
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!isDrawingMode) {
      map.getContainer().style.cursor = '';
      if (drawingLayerRef.current) {
        drawingLayerRef.current.clearLayers();
      }
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
          if (drawingLayerRef.current) {
            drawingLayerRef.current.clearLayers();
          }
          onDrawingModeChange?.(null);
        }
      } else if (isDrawingMode === 'pentagon') {
        if (drawingPoints.length < 4) {
          setDrawingPoints(prev => [...prev, clicked]);
        } else {
          // 5th point finishes the pentagon automatically!
          finalizePolygon([...drawingPoints, clicked]);
        }
      } else if (isDrawingMode === 'polygon') {
        // Check if clicking near first point to close
        if (drawingPoints.length >= 3) {
          const first = drawingPoints[0];
          const dist = map.distance(clicked, first);
          if (dist < 45) {
            finalizePolygon();
            return;
          }
        }
        setDrawingPoints(prev => [...prev, clicked]);
      }
    };

    const handleMapDblClick = (e: L.LeafletMouseEvent) => {
      L.DomEvent.stopPropagation(e);
      if ((isDrawingMode === 'polygon' || isDrawingMode === 'pentagon') && drawingPoints.length >= 3) {
        finalizePolygon();
      }
    };

    map.on('click', handleMapClick);
    map.on('dblclick', handleMapDblClick);

    return () => {
      map.off('click', handleMapClick);
      map.off('dblclick', handleMapDblClick);
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
            title="Desenhar Bounding Box Retangular no mapa (2 pontos)"
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
            id="btn-draw-pentagon"
            onClick={() => onDrawingModeChange?.(isDrawingMode === 'pentagon' ? null : 'pentagon')}
            title="Demarcar área pentagonal (5 vértices sobre a imagem)"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isDrawingMode === 'pentagon'
                ? 'bg-amber-500 text-slate-950 shadow-sm ring-1 ring-amber-400 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Pentagon className="w-3.5 h-3.5" />
            <span>Pentágono</span>
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
            <Layers className="w-3.5 h-3.5" />
            <span>Polígono Livre</span>
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

        {/* Cobertura do Solo Opacity Slider (if classification active) */}
        {lulcGeoJson && (
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-lg text-xs text-slate-300">
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>Opacidade da Cobertura:</span>
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

      {/* Polygon Drawing Active Controls Banner */}
      {isDrawingMode === 'polygon' && (
        <div className="absolute top-16 left-3 right-3 sm:right-auto z-[1000] bg-slate-900/95 border border-amber-500/50 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl text-xs shadow-2xl flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="font-bold text-amber-400">Desenho de Polígono</span>
            <span className="bg-slate-800 px-2 py-0.5 rounded-full font-mono text-[11px] text-slate-200">
              {drawingPoints.length} {drawingPoints.length === 1 ? 'vértice' : 'vértices'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <button
              type="button"
              onClick={handleUndoVertex}
              disabled={drawingPoints.length === 0}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-medium flex items-center gap-1 transition-all cursor-pointer"
              title="Desfazer último vértice marcado"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Desfazer</span>
            </button>

            <button
              type="button"
              onClick={() => finalizePolygon()}
              disabled={drawingPoints.length < 3}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                drawingPoints.length >= 3
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 ring-2 ring-emerald-400/50'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
              title={drawingPoints.length >= 3 ? "Finalizar e fechar polígono" : "Mínimo 3 vértices necessários"}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Finalizar Polígono</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDrawingPoints([]);
                if (drawingLayerRef.current) drawingLayerRef.current.clearLayers();
                onDrawingModeChange?.(null);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Pentagon (5 Vertices) Drawing Active Controls Banner */}
      {isDrawingMode === 'pentagon' && (
        <div className="absolute top-16 left-3 right-3 sm:right-auto z-[1000] bg-slate-900/95 border border-amber-500/60 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl text-xs shadow-2xl flex flex-wrap items-center gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="font-bold text-amber-400">Demarcação de Pentágono (5 Vértices)</span>
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono text-[11px] font-bold">
              Vértice {drawingPoints.length} de 5
            </span>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <button
              type="button"
              onClick={() => handleStampRegularPentagon(2.0)}
              className="px-2.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              title="Carimbar pentágono regular de 5 lados no centro da tela"
            >
              <Pentagon className="w-3.5 h-3.5 text-sky-400" />
              <span>Pentágono Regular (2 km)</span>
            </button>

            <button
              type="button"
              onClick={handleUndoVertex}
              disabled={drawingPoints.length === 0}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-medium flex items-center gap-1 transition-all cursor-pointer"
              title="Desfazer último ponto marcado"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Desfazer</span>
            </button>

            <button
              type="button"
              onClick={() => finalizePolygon()}
              disabled={drawingPoints.length < 3}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                drawingPoints.length >= 3
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 ring-2 ring-emerald-400/50'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
              title="Fechar pentágono com os pontos já marcados"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Concluir</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDrawingPoints([]);
                if (drawingLayerRef.current) drawingLayerRef.current.clearLayers();
                onDrawingModeChange?.(null);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Box Drawing Active Helper Banner */}
      {isDrawingMode === 'box' && (
        <div className="absolute top-16 left-3 right-3 sm:right-auto z-[1000] bg-amber-500/95 backdrop-blur-md text-slate-950 px-4 py-2.5 rounded-2xl text-xs font-semibold shadow-2xl flex items-center justify-between gap-3 animate-pulse">
          <div>
            {drawingPoints.length === 0
              ? '1. Clique no primeiro canto da área retangular no mapa...'
              : '2. Clique no canto diagonal oposto para fechar o retângulo.'}
          </div>
          <button
            type="button"
            onClick={() => {
              setDrawingPoints([]);
              if (drawingLayerRef.current) drawingLayerRef.current.clearLayers();
              onDrawingModeChange?.(null);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-950 text-white text-[10px] font-bold cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Rectangle 4-Side Formatting Tool (when a Bounding Box is defined) */}
      {bbox && !isDrawingMode && (
        <div className="absolute top-16 right-3 z-[1000] bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3 shadow-2xl text-xs text-white max-w-xs transition-all">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <div className="flex items-center gap-1.5 font-bold text-sky-400">
              <Move className="w-3.5 h-3.5" />
              <span>Editar 4 Lados do Retângulo</span>
            </div>
            <button
              type="button"
              onClick={() => setShowBboxFormatBar(!showBboxFormatBar)}
              className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800"
            >
              {showBboxFormatBar ? 'Minimizar' : 'Expandir'}
            </button>
          </div>

          {showBboxFormatBar && (
            <div className="space-y-2">
              {/* Step size selector */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1">
                <span>Passo de ajuste:</span>
                <div className="flex gap-1">
                  {[0.2, 0.5, 1.0, 2.0].map((step) => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => setFormatStepKm(step)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer ${
                        formatStepKm === step
                          ? 'bg-sky-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {step >= 1 ? `${step}km` : `${step * 1000}m`}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4 sides directional buttons */}
              <div className="grid grid-cols-2 gap-1.5">
                {/* Norte */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-1.5 flex items-center justify-between">
                  <span className="font-semibold text-slate-300 text-[11px]">Norte</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => adjustBboxSide('north', 'shrink')}
                      title="Diminuir lado Norte"
                      className="p-1 rounded bg-slate-800 hover:bg-rose-900/40 text-rose-300 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustBboxSide('north', 'expand')}
                      title="Expandir lado Norte"
                      className="p-1 rounded bg-slate-800 hover:bg-emerald-900/40 text-emerald-300 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Sul */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-1.5 flex items-center justify-between">
                  <span className="font-semibold text-slate-300 text-[11px]">Sul</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => adjustBboxSide('south', 'shrink')}
                      title="Diminuir lado Sul"
                      className="p-1 rounded bg-slate-800 hover:bg-rose-900/40 text-rose-300 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustBboxSide('south', 'expand')}
                      title="Expandir lado Sul"
                      className="p-1 rounded bg-slate-800 hover:bg-emerald-900/40 text-emerald-300 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Leste */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-1.5 flex items-center justify-between">
                  <span className="font-semibold text-slate-300 text-[11px]">Leste</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => adjustBboxSide('east', 'shrink')}
                      title="Diminuir lado Leste"
                      className="p-1 rounded bg-slate-800 hover:bg-rose-900/40 text-rose-300 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustBboxSide('east', 'expand')}
                      title="Expandir lado Leste"
                      className="p-1 rounded bg-slate-800 hover:bg-emerald-900/40 text-emerald-300 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Oeste */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-1.5 flex items-center justify-between">
                  <span className="font-semibold text-slate-300 text-[11px]">Oeste</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => adjustBboxSide('west', 'shrink')}
                      title="Diminuir lado Oeste"
                      className="p-1 rounded bg-slate-800 hover:bg-rose-900/40 text-rose-300 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustBboxSide('west', 'expand')}
                      title="Expandir lado Oeste"
                      className="p-1 rounded bg-slate-800 hover:bg-emerald-900/40 text-emerald-300 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
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
