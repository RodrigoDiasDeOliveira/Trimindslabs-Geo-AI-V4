import { CarbonAuditResult, LULCClassResult } from '../types';

/**
 * Brazilian Biome Specific Carbon Factors (metric tonnes CO2 equivalent per hectare, tCO2e/ha).
 * Sources:
 * - MCTI / SIRENE: Quarta Comunicação Nacional do Brasil à UNFCCC (2020)
 * - MapBiomas Biomassa Coleção 2.0 (Biomassa Aérea e Subterrânea)
 * - IPCC 2006 Guidelines for National GHG Inventories (AFOLU, Vol 4)
 */
const BIOME_CARBON_FACTORS: Record<string, Record<string, number>> = {
  amazonia: {
    Forest: 320.0, // Dense moist tropical ombrophilous forest
    AnnualCrop: 12.4,
    Pasture: 24.5,
    HerbaceousVegetation: 45.0,
    River: 0.0,
    Highway: 0.0
  },
  cerrado: {
    Forest: 165.8, // Cerradão and riparian forest
    AnnualCrop: 12.4,
    Pasture: 24.5,
    HerbaceousVegetation: 38.2, // Campo sujo / cerrado sensu stricto
    River: 0.0,
    Highway: 0.0
  },
  pantanal: {
    Forest: 142.0,
    AnnualCrop: 12.4,
    Pasture: 22.0,
    HerbaceousVegetation: 32.0,
    River: 0.0,
    Highway: 0.0
  },
  mata_atlantica: {
    Forest: 180.0,
    AnnualCrop: 12.4,
    Pasture: 24.5,
    HerbaceousVegetation: 35.0,
    River: 0.0,
    Highway: 0.0
  }
};

export function calculateCarbonAudit(
  classes: LULCClassResult[],
  biomeName: string,
  totalHectares: number
): CarbonAuditResult {
  const normBiome = biomeName.toLowerCase();
  let selectedFactors = BIOME_CARBON_FACTORS.cerrado;

  if (normBiome.includes('amazôn') || normBiome.includes('tapajós')) {
    selectedFactors = BIOME_CARBON_FACTORS.amazonia;
  } else if (normBiome.includes('pantanal')) {
    selectedFactors = BIOME_CARBON_FACTORS.pantanal;
  } else if (normBiome.includes('mata atlântica') || normBiome.includes('paraná')) {
    selectedFactors = BIOME_CARBON_FACTORS.mata_atlantica;
  }

  let totalStockTon = 0;
  const factorsUsed: Record<string, number> = {};

  for (const c of classes) {
    const factor = selectedFactors[c.classId] ?? 0;
    factorsUsed[c.classId] = factor;
    totalStockTon += c.hectares * factor;
  }

  const roundedTotal = Math.round(totalStockTon);
  const avgDensity = totalHectares > 0 ? Number((roundedTotal / totalHectares).toFixed(2)) : 0;

  return {
    methodology: 'IPCC 2006 Guidelines (AFOLU Tier 1) & MCTI 4ª Comunicação Nacional (SIRENE 2020)',
    standardReference: 'Fatores de Emissão e Estoque de Carbono Médio por Bioma Brasileiro (MapBiomas Biomassa v2)',
    totalEstimatedStockTonCO2e: roundedTotal,
    averageDensityTonHa: avgDensity,
    assumptions: [
      'Estoque estimado combinando biomassa aérea viva, raízes e carbono orgânico do solo (0-30cm).',
      'Conversão estequiométrica de Biomassa Seca para Carbono (CF = 0.47) e CO2e (fator 44/12 = 3.667).',
      'Para certificação regulatória de créditos de carbono (Verra VCS / ART TREES), requer amostragem florestal em campo ou transectos LiDAR.',
      'Classes de água e infraestrutura possuem fator de emissão zero (0 tCO2e/ha).'
    ],
    factorsUsed
  };
}
