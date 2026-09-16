import { BBox, GeoJSONPolygon, LatLng, ROIValidationResult } from '../types';

const EARTH_RADIUS_METERS = 6371008.8;
const MAX_ALLOWED_HECTARES = 100000; // 100,000 hectares cap for on-demand cloud container processing

/**
 * Calculates geodesic area of a polygon on Earth's surface in square meters
 * using the standard spherical excess formula.
 */
function calculateSphericalPolygonArea(coords: number[][]): number {
  if (!coords || coords.length < 3) return 0;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  // If closed ring, drop last duplicate vertex
  let ring = coords;
  if (
    coords.length > 3 &&
    coords[0][0] === coords[coords.length - 1][0] &&
    coords[0][1] === coords[coords.length - 1][1]
  ) {
    ring = coords.slice(0, -1);
  }

  const n = ring.length;
  if (n < 3) return 0;

  let total = 0;
  for (let i = 0; i < n; i++) {
    const p1 = ring[i];
    const p2 = ring[(i + 1) % n];
    const lambda1 = toRad(p1[0]);
    const lambda2 = toRad(p2[0]);
    const phi1 = toRad(p1[1]);
    const phi2 = toRad(p2[1]);
    total += (lambda2 - lambda1) * (2 + Math.sin(phi1) + Math.sin(phi2));
  }

  let area = Math.abs((total * EARTH_RADIUS_METERS * EARTH_RADIUS_METERS) / 2.0);
  const sphereArea = 4 * Math.PI * EARTH_RADIUS_METERS * EARTH_RADIUS_METERS;
  if (area > sphereArea / 2) {
    area = sphereArea - area;
  }

  return area;
}

/**
 * Calculates perimeter of a closed ring in kilometers using Haversine distance.
 */
function calculatePerimeterKm(coords: number[][]): number {
  let perimeterMeters = 0;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  for (let i = 0; i < coords.length - 1; i++) {
    const [lon1, lat1] = coords[i];
    const [lon2, lat2] = coords[i + 1];

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    perimeterMeters += EARTH_RADIUS_METERS * c;
  }

  return Number((perimeterMeters / 1000).toFixed(2));
}

/**
 * Validates a GeoJSON Polygon or BBox and extracts strict geographical metadata.
 */
export function validateROI(input: any): ROIValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!input) {
    return { valid: false, errors: ['Nenhum dado geográfico fornecido para o ROI.'], warnings };
  }

  let polygon: GeoJSONPolygon | null = null;

  // Case 1: Input is a BBox array [minLng, minLat, maxLng, maxLat]
  if (Array.isArray(input) && input.length === 4 && input.every(n => typeof n === 'number')) {
    const [minLng, minLat, maxLng, maxLat] = input;
    if (minLng >= maxLng || minLat >= maxLat) {
      errors.push('Coordenadas de Bounding Box invertidas ou degeneradas.');
    } else {
      polygon = {
        type: 'Polygon',
        coordinates: [
          [
            [minLng, minLat],
            [maxLng, minLat],
            [maxLng, maxLat],
            [minLng, maxLat],
            [minLng, minLat]
          ]
        ]
      };
    }
  }

  // Case 2: Input is GeoJSON Polygon or Feature
  if (!polygon) {
    if (input.type === 'Feature' && input.geometry?.type === 'Polygon') {
      polygon = input.geometry as GeoJSONPolygon;
    } else if (input.type === 'Polygon' && Array.isArray(input.coordinates)) {
      polygon = input as GeoJSONPolygon;
    }
  }

  if (!polygon || !Array.isArray(polygon.coordinates) || polygon.coordinates.length === 0) {
    errors.push('Formato geométrico inválido. Esperava-se um GeoJSON Polygon ou Bounding Box [minLng, minLat, maxLng, maxLat].');
    return { valid: false, errors, warnings };
  }

  const exteriorRing = polygon.coordinates[0];
  if (!Array.isArray(exteriorRing) || exteriorRing.length < 4) {
    errors.push('O anel externo do polígono deve conter pelo menos 4 coordenadas (incluindo o fechamento).');
    return { valid: false, errors, warnings };
  }

  // Check closure: first vertex == last vertex
  const first = exteriorRing[0];
  const last = exteriorRing[exteriorRing.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    // Automatically close the ring if off by a small amount, or push warning
    exteriorRing.push([first[0], first[1]]);
    warnings.push('O polígono não estava explicitamente fechado. O vértice final foi adicionado automaticamente.');
  }

  // Check valid lat/lng boundaries
  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  let sumLng = 0;
  let sumLat = 0;

  for (let i = 0; i < exteriorRing.length; i++) {
    const pt = exteriorRing[i];
    if (!Array.isArray(pt) || pt.length < 2 || typeof pt[0] !== 'number' || typeof pt[1] !== 'number') {
      errors.push(`Vértice inválido no índice ${i}: esperado [longitude, latitude].`);
      continue;
    }

    const [lng, lat] = pt;

    if (isNaN(lng) || isNaN(lat)) {
      errors.push(`Coordenada NaN detectada no índice ${i}.`);
    }

    if (lng < -180 || lng > 180) {
      errors.push(`Longitude ${lng} fora dos limites válidos (-180 a 180).`);
    }

    if (lat < -90 || lat > 90) {
      errors.push(`Latitude ${lat} fora dos limites válidos (-90 a 90).`);
    }

    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;

    if (i < exteriorRing.length - 1) {
      sumLng += lng;
      sumLat += lat;
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  const bbox: BBox = [Number(minLng.toFixed(6)), Number(minLat.toFixed(6)), Number(maxLng.toFixed(6)), Number(maxLat.toFixed(6))];
  const vertexCount = exteriorRing.length - 1;
  const centroid: LatLng = {
    lat: Number((sumLat / vertexCount).toFixed(6)),
    lng: Number((sumLng / vertexCount).toFixed(6))
  };

  // Calculate area in square meters, then hectares (1 hectare = 10,000 m2)
  const areaSqMeters = calculateSphericalPolygonArea(exteriorRing);
  const areaHectares = Number((areaSqMeters / 10000).toFixed(2));
  const perimeterKm = calculatePerimeterKm(exteriorRing);

  if (areaHectares <= 0) {
    errors.push('A área calculada é zero ou degenerada. Verifique as dimensões do polígono.');
    return { valid: false, errors, warnings };
  }

  if (areaHectares > MAX_ALLOWED_HECTARES) {
    errors.push(`A área selecionada (${areaHectares.toLocaleString('pt-BR')} ha) excede o limite máximo permitido de ${MAX_ALLOWED_HECTARES.toLocaleString('pt-BR')} ha para processamento sob demanda.`);
    return { valid: false, errors, warnings };
  }

  if (areaHectares < 1.0) {
    warnings.push('Área selecionada inferior a 1 hectare. A resolução dos sensores de 10m pode conter poucas amostras de pixels.');
  }

  return {
    valid: true,
    errors: [],
    warnings,
    geometry: polygon,
    bbox,
    centroid,
    areaHectares,
    perimeterKm,
    vertexCount
  };
}
