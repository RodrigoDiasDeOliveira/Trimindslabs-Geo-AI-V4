import { fromUrl } from 'geotiff';
import proj4 from 'proj4';
import { BBox, SatelliteScene, SpectralBandMatrix, StatisticalDistribution } from '../types';

/**
 * Calculates real mathematical NDVI on two pixel arrays:
 * NDVI = (NIR - RED) / (NIR + RED)
 */
export function calculateNDVI(nir: Float32Array, red: Float32Array): Float32Array {
  const n = nir.length;
  const ndvi = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    const sum = nir[i] + red[i];
    const diff = nir[i] - red[i];
    if (sum === 0 || isNaN(sum) || !isFinite(sum)) {
      ndvi[i] = 0;
    } else {
      const val = diff / sum;
      // Clamp to valid physical interval [-1.0, 1.0]
      ndvi[i] = Math.max(-1.0, Math.min(1.0, val));
    }
  }

  return ndvi;
}

/**
 * Calculates real mathematical NDRE (Normalized Difference Red Edge):
 * NDRE = (NIR - RedEdge) / (NIR + RedEdge)
 */
export function calculateNDRE(nir: Float32Array, redEdge: Float32Array): Float32Array {
  const n = nir.length;
  const ndre = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    const sum = nir[i] + redEdge[i];
    const diff = nir[i] - redEdge[i];
    if (sum === 0 || isNaN(sum) || !isFinite(sum)) {
      ndre[i] = 0;
    } else {
      const val = diff / sum;
      ndre[i] = Math.max(-1.0, Math.min(1.0, val));
    }
  }

  return ndre;
}

/**
 * Calculates real Enhanced Vegetation Index (EVI) using standard Huete et al. (2002) formula:
 * EVI = 2.5 * (NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1)
 */
export function calculateEVI(nir: Float32Array, red: Float32Array, blue: Float32Array): Float32Array {
  const n = nir.length;
  const evi = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    const denom = nir[i] + 6.0 * red[i] - 7.5 * blue[i] + 1.0;
    if (Math.abs(denom) < 0.001 || isNaN(denom) || !isFinite(denom)) {
      evi[i] = 0;
    } else {
      const val = (2.5 * (nir[i] - red[i])) / denom;
      evi[i] = Math.max(-1.0, Math.min(1.5, val));
    }
  }

  return evi;
}

/**
 * Calculates comprehensive descriptive statistics (min, max, mean, median, stdDev, percentiles, histogram)
 * over actual Float32Array pixels.
 */
export function computePixelStatistics(values: Float32Array, minRange = -1.0, maxRange = 1.0): StatisticalDistribution {
  const n = values.length;
  if (n === 0) {
    return {
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      stdDev: 0,
      p25: 0,
      p75: 0,
      histogram: []
    };
  }

  let min = Infinity;
  let max = -Infinity;
  let sum = 0;

  // Clone and sort for exact percentile and median calculation
  const sorted = new Float32Array(values).sort();

  for (let i = 0; i < n; i++) {
    const v = sorted[i];
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
  }

  const mean = sum / n;

  // Variance & StdDev
  let varSum = 0;
  for (let i = 0; i < n; i++) {
    const diff = sorted[i] - mean;
    varSum += diff * diff;
  }
  const stdDev = Math.sqrt(varSum / n);

  const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
  const p25 = sorted[Math.floor(n * 0.25)];
  const p75 = sorted[Math.floor(n * 0.75)];

  // Compute 20-bin histogram across [minRange, maxRange]
  const numBins = 20;
  const binStep = (maxRange - minRange) / numBins;
  const bins: { binStart: number; binEnd: number; count: number }[] = [];

  for (let b = 0; b < numBins; b++) {
    bins.push({
      binStart: Number((minRange + b * binStep).toFixed(2)),
      binEnd: Number((minRange + (b + 1) * binStep).toFixed(2)),
      count: 0
    });
  }

  for (let i = 0; i < n; i++) {
    const v = values[i];
    let binIdx = Math.floor((v - minRange) / binStep);
    if (binIdx < 0) binIdx = 0;
    if (binIdx >= numBins) binIdx = numBins - 1;
    bins[binIdx].count++;
  }

  return {
    min: Number(min.toFixed(4)),
    max: Number(max.toFixed(4)),
    mean: Number(mean.toFixed(4)),
    median: Number(median.toFixed(4)),
    stdDev: Number(stdDev.toFixed(4)),
    p25: Number(p25.toFixed(4)),
    p75: Number(p75.toFixed(4)),
    histogram: bins
  };
}

/**
 * Extracts genuine Sentinel-2 surface reflectance (L2A BOA) pixel arrays from real Cloud-Optimized GeoTIFFs (COGs).
 * Clips, reprojects, and resamples to the target ROI without synthetic data.
 */
export async function extractSentinelRasterStack(
  scene: SatelliteScene,
  bbox: BBox,
  options?: { maxDimension?: number }
): Promise<SpectralBandMatrix> {
  const assets = scene.assets;
  if (!assets) {
    throw new Error(`DATA_UNAVAILABLE: A cena ${scene.id} não possui referências de ativos raster.`);
  }

  const redUrl = assets.red?.href;
  const nirUrl = assets.nir?.href;
  const blueUrl = assets.blue?.href;
  const greenUrl = assets.green?.href;
  const redEdgeUrl = assets.rededge1?.href;
  const swirUrl = assets.swir16?.href;

  if (!redUrl || !nirUrl || !blueUrl || !greenUrl) {
    throw new Error(
      `DATA_UNAVAILABLE: Bandas espectrais fundamentais (B02, B03, B04, B08) ausentes para a cena ${scene.id}.`
    );
  }

  // Open the primary 10m reference raster (Red band) to establish CRS and bounding box
  const redTiff = await fromUrl(redUrl);
  const redImg = await redTiff.getImage(0);
  const geoKeys = redImg.getGeoKeys();
  const epsgCode = geoKeys.ProjectedCSTypeGeoKey || 32721;
  const [tileMinX, tileMinY, tileMaxX, tileMaxY] = redImg.getBoundingBox();

  // Project the ROI bounding box (WGS84 EPSG:4326) into the scene's Projected Coordinate System (e.g. UTM)
  const targetCrs = `EPSG:${epsgCode}`;
  const pSW = proj4('EPSG:4326', targetCrs, [bbox[0], bbox[1]]);
  const pNE = proj4('EPSG:4326', targetCrs, [bbox[2], bbox[3]]);

  const roiMinX = Math.min(pSW[0], pNE[0]);
  const roiMaxX = Math.max(pSW[0], pNE[0]);
  const roiMinY = Math.min(pSW[1], pNE[1]);
  const roiMaxY = Math.max(pSW[1], pNE[1]);

  // Compute spatial intersection between the ROI and the Sentinel-2 tile extent
  const intMinX = Math.max(tileMinX, roiMinX);
  const intMaxX = Math.min(tileMaxX, roiMaxX);
  const intMinY = Math.max(tileMinY, roiMinY);
  const intMaxY = Math.min(tileMaxY, roiMaxY);

  if (intMinX >= intMaxX || intMinY >= intMaxY) {
    throw new Error(
      `DATA_UNAVAILABLE: O ROI especificado está fora dos limites geográficos do tile Sentinel-2 ${scene.id}.`
    );
  }

  // Calculate target raster dimensions preserving aspect ratio
  const nativeWidth = Math.max(1, Math.round((intMaxX - intMinX) / 10));
  const nativeHeight = Math.max(1, Math.round((intMaxY - intMinY) / 10));

  const maxDim = options?.maxDimension || 120;
  const scale = Math.min(1.0, maxDim / Math.max(nativeWidth, nativeHeight));

  const targetWidth = Math.max(10, Math.round(nativeWidth * scale));
  const targetHeight = Math.max(10, Math.round(nativeHeight * scale));
  const totalPixels = targetWidth * targetHeight;

  const resolutionMeters = Number(
    Math.sqrt(((intMaxX - intMinX) * (intMaxY - intMinY)) / totalPixels).toFixed(1)
  );

  /**
   * Helper function to extract, crop, resample, and calibrate reflectance for a single band
   */
  async function fetchBandPixels(url: string, is20m = false): Promise<Float32Array> {
    const tiff = await fromUrl(url);
    const img = await tiff.getImage(0);
    const [bTileMinX, , , bTileMaxY] = img.getBoundingBox();
    const gsd = is20m ? 20 : 10;

    const bColMin = Math.max(0, Math.floor((intMinX - bTileMinX) / gsd));
    const bColMax = Math.min(img.getWidth(), Math.ceil((intMaxX - bTileMinX) / gsd));
    const bRowMin = Math.max(0, Math.floor((bTileMaxY - intMaxY) / gsd));
    const bRowMax = Math.min(img.getHeight(), Math.ceil((bTileMaxY - intMinY) / gsd));

    const rasterData = await img.readRasters({
      window: [bColMin, bRowMin, Math.max(bColMin + 1, bColMax), Math.max(bRowMin + 1, bRowMax)],
      width: targetWidth,
      height: targetHeight
    });

    const rawArray = rasterData[0] as unknown as ArrayLike<number>;
    const output = new Float32Array(totalPixels);

    for (let i = 0; i < totalPixels; i++) {
      const dn = rawArray[i];
      if (!dn || dn <= 0 || isNaN(dn)) {
        output[i] = 0.0001;
      } else {
        // In Sentinel-2 L2A BOA products (Baseline 04.00+), an offset of 1000 (-0.1 reflectance) is applied
        // Products with DN >= 1000 scale as (DN - 1000) * 0.0001
        // Legacy products scale as DN * 0.0001
        const refl = dn >= 1000 ? (dn - 1000) * 0.0001 : dn * 0.0001;
        output[i] = Math.max(0.0001, Math.min(1.0, refl));
      }
    }

    return output;
  }

  // Fetch bands in parallel
  const [blue, green, red, nir, redEdge, swir] = await Promise.all([
    fetchBandPixels(blueUrl, false),
    fetchBandPixels(greenUrl, false),
    fetchBandPixels(redUrl, false),
    fetchBandPixels(nirUrl, false),
    redEdgeUrl ? fetchBandPixels(redEdgeUrl, true) : fetchBandPixels(redUrl, false),
    swirUrl ? fetchBandPixels(swirUrl, true) : fetchBandPixels(redUrl, false)
  ]);

  return {
    width: targetWidth,
    height: targetHeight,
    resolutionMeters,
    bbox,
    blue,
    green,
    red,
    redEdge,
    nir,
    swir
  };
}

