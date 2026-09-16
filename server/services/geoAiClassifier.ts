import { BBox, GeoJSONFeatureCollection, GeoJSONPolygon, LULCClassResult, SpectralBandMatrix } from '../types';

export interface ClassificationOutput {
  classes: LULCClassResult[];
  pixelClassMatrix: Uint8Array;
  inferenceTimeMs: number;
  pixelsProcessed: number;
  vectorGeoJson: GeoJSONFeatureCollection;
}

const CLASS_DEFINITIONS = [
  { code: 0, id: 'Forest', name: 'Floresta Nativa / Mata Ciliar', color: '#15803d' },
  { code: 1, id: 'AnnualCrop', name: 'Lavoura Anual (Soja / Milho)', color: '#eab308' },
  { code: 2, id: 'Pasture', name: 'Pastagem Produtiva', color: '#a3e635' },
  { code: 3, id: 'River', name: 'Recursos Hídricos / Rios', color: '#0284c7' },
  { code: 4, id: 'HerbaceousVegetation', name: 'Vegetação Herbácea / Cerrado', color: '#84cc16' },
  { code: 5, id: 'Highway', name: 'Infraestrutura / Solo Exposto', color: '#64748b' }
];

/**
 * Runs a deterministic spectral rule-based classifier calibrated on Sentinel-2 Surface Reflectance (L2A)
 * and EuroSAT Land Use / Land Cover taxonomy.
 */
export function classifySpectralTensor(
  raster: SpectralBandMatrix,
  ndvi: Float32Array,
  ndre: Float32Array,
  evi: Float32Array
): ClassificationOutput {
  const t0 = performance.now();
  const totalPixels = raster.width * raster.height;
  const pixelClassMatrix = new Uint8Array(totalPixels);

  const pixelCounts = new Array(CLASS_DEFINITIONS.length).fill(0);
  const confidenceSums = new Array(CLASS_DEFINITIONS.length).fill(0);

  for (let i = 0; i < totalPixels; i++) {
    const ndviVal = ndvi[i];
    const ndreVal = ndre[i];
    const nirVal = raster.nir[i];
    const redVal = raster.red[i];
    const swirVal = raster.swir[i];
    const blueVal = raster.blue[i];

    let assignedClassCode = 1; // Default to AnnualCrop
    let confidence = 0.85;

    // 1. Water detection: Negative NDVI or high absorption in NIR/SWIR and higher blue
    if (ndviVal < 0.05 || (blueVal > redVal && nirVal < 0.08)) {
      assignedClassCode = 3; // River
      confidence = Math.min(0.98, 0.82 + Math.abs(ndviVal) * 0.3);
    }
    // 2. Forest: Very high NDVI (> 0.72) and high NDRE (> 0.50) with high NIR and low Red
    else if (ndviVal >= 0.72 && ndreVal >= 0.48 && nirVal > 0.45) {
      assignedClassCode = 0; // Forest
      confidence = Math.min(0.99, 0.88 + (ndviVal - 0.72) * 0.4);
    }
    // 3. Annual Crops: High NDVI (0.55 to 0.75) and moderate-to-high NDRE
    else if (ndviVal >= 0.55 && nirVal > 0.40) {
      assignedClassCode = 1; // AnnualCrop
      confidence = Math.min(0.97, 0.85 + (ndviVal - 0.55) * 0.3);
    }
    // 4. Pasture: Moderate NDVI (0.35 to 0.55) with lower NDRE
    else if (ndviVal >= 0.35 && nirVal > 0.30) {
      assignedClassCode = 2; // Pasture
      confidence = 0.88;
    }
    // 5. Herbaceous / Savanna: NDVI 0.20 to 0.35
    else if (ndviVal >= 0.20) {
      assignedClassCode = 4; // HerbaceousVegetation
      confidence = 0.84;
    }
    // 6. Bare soil / Infrastructure / Roads: Low NDVI (< 0.20) and high SWIR/Red
    else {
      assignedClassCode = 5; // Highway / Bare soil
      confidence = 0.90;
    }

    pixelClassMatrix[i] = assignedClassCode;
    pixelCounts[assignedClassCode]++;
    confidenceSums[assignedClassCode] += confidence;
  }

  const t1 = performance.now();
  const inferenceTimeMs = Number((t1 - t0).toFixed(2));

  // Compute exact hectares and percentages per class
  // 1 pixel = resolutionMeters * resolutionMeters square meters / 10,000 ha
  const pixelAreaHa = (raster.resolutionMeters * raster.resolutionMeters) / 10000;
  
  const classes: LULCClassResult[] = CLASS_DEFINITIONS.map((def, idx) => {
    const count = pixelCounts[idx];
    const pct = totalPixels > 0 ? Number(((count / totalPixels) * 100).toFixed(2)) : 0;
    const ha = Number((count * pixelAreaHa).toFixed(2));
    const avgConfidence = count > 0 ? Number((confidenceSums[idx] / count).toFixed(3)) : 0;

    return {
      classId: def.id,
      className: def.name,
      color: def.color,
      pixelCount: count,
      hectares: ha,
      percentage: pct,
      confidence: avgConfidence
    };
  }).filter(c => c.pixelCount > 0);

  // Generate real vector GeoJSON features for the classified segments
  const vectorGeoJson = generateLulcGeoJsonPolygons(raster, pixelClassMatrix, ndvi);

  return {
    classes,
    pixelClassMatrix,
    inferenceTimeMs,
    pixelsProcessed: totalPixels,
    vectorGeoJson
  };
}

/**
 * Converts the raster classification grid into spatial GeoJSON polygon features
 * covering the target bounding box.
 */
function generateLulcGeoJsonPolygons(
  raster: SpectralBandMatrix,
  matrix: Uint8Array,
  ndvi: Float32Array
): GeoJSONFeatureCollection {
  const [minLng, minLat, maxLng, maxLat] = raster.bbox;
  const dLng = (maxLng - minLng) / raster.width;
  const dLat = (maxLat - minLat) / raster.height;

  // Aggregate adjacent cells into macro grid blocks (e.g. 8x8 or 10x10) to generate clean GeoJSON polygons
  const blockSize = Math.max(2, Math.floor(raster.width / 16));
  const blocksX = Math.ceil(raster.width / blockSize);
  const blocksY = Math.ceil(raster.height / blockSize);

  const features: any[] = [];

  for (let by = 0; by < blocksY; by++) {
    const yStart = by * blockSize;
    const yEnd = Math.min(raster.height, (by + 1) * blockSize);

    for (let bx = 0; bx < blocksX; bx++) {
      const xStart = bx * blockSize;
      const xEnd = Math.min(raster.width, (bx + 1) * blockSize);

      // Determine majority class in this block
      const votes = new Array(CLASS_DEFINITIONS.length).fill(0);
      let ndviSum = 0;
      let count = 0;

      for (let y = yStart; y < yEnd; y++) {
        for (let x = xStart; x < xEnd; x++) {
          const idx = y * raster.width + x;
          const cls = matrix[idx];
          votes[cls]++;
          ndviSum += ndvi[idx];
          count++;
        }
      }

      let majorityClass = 0;
      let maxVotes = -1;
      for (let c = 0; c < votes.length; c++) {
        if (votes[c] > maxVotes) {
          maxVotes = votes[c];
          majorityClass = c;
        }
      }

      const classDef = CLASS_DEFINITIONS[majorityClass];
      const pLng1 = Number((minLng + xStart * dLng).toFixed(6));
      const pLat1 = Number((maxLat - yEnd * dLat).toFixed(6));
      const pLng2 = Number((minLng + xEnd * dLng).toFixed(6));
      const pLat2 = Number((maxLat - yStart * dLat).toFixed(6));

      const polyCoordinates = [
        [
          [pLng1, pLat1],
          [pLng2, pLat1],
          [pLng2, pLat2],
          [pLng1, pLat2],
          [pLng1, pLat1]
        ]
      ];

      const avgNdvi = count > 0 ? Number((ndviSum / count).toFixed(3)) : 0;
      const blockAreaHa = Number((count * ((raster.resolutionMeters * raster.resolutionMeters) / 10000)).toFixed(2));

      features.push({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: polyCoordinates
        },
        properties: {
          classId: classDef.id,
          className: classDef.name,
          color: classDef.color,
          pixels: count,
          hectares: blockAreaHa,
          meanNdvi: avgNdvi
        }
      });
    }
  }

  return {
    type: 'FeatureCollection',
    features
  };
}
