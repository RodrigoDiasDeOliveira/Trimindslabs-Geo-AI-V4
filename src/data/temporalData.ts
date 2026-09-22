export interface TemporalYearData {
  year: number; // 2020, 2021, 2022, 2023, 2024, 2025
  cropsPct: number; // 1 Lavouras
  pasturePct: number; // 2 Pastagens
  waterPct: number; // 3 Recursos Hídricos
  forestPct: number; // 4 Floresta
  reforestationPct: number; // 5 Reflorestamento
  ndviMean: number;
  carbonStockTonsHa: number;
  lossAlertHectares: number;
  notes: string;
}

export interface TemporalRegion {
  id: string;
  name: string;
  stateOrProvince: string;
  countryId: string;
  continentId: string;
  totalHectares: number;
  centerCoordinates: { lat: number; lng: number };
  biome: string;
  previewUrl: string;
  years: Record<number, TemporalYearData>; // 2020 - 2025
  historicalSummary: string;
}

export interface Country {
  id: string;
  name: string;
  flag: string;
  continentId: string;
  regions: TemporalRegion[];
}

export interface Continent {
  id: string;
  name: string;
  icon: string;
  countries: Country[];
}

export const TEMPORAL_HIERARCHY: Continent[] = [
  {
    id: 'south_america',
    name: 'América do Sul',
    icon: '🌎',
    countries: [
      {
        id: 'brazil',
        name: 'Brasil',
        flag: '🇧🇷',
        continentId: 'south_america',
        regions: [
          {
            id: 'br_sorriso',
            name: 'Sorriso (Médio-Norte Mato-Grossense)',
            stateOrProvince: 'Mato Grosso',
            countryId: 'brazil',
            continentId: 'south_america',
            totalHectares: 125000,
            centerCoordinates: { lat: -12.542, lng: -55.721 },
            biome: 'Cerrado / Transição Amazônica',
            previewUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
            historicalSummary: 'Intensificação agrícola por meio de rotação soja-milho safrinha e recuperação de áreas degradadas com reflorestamento ciliar.',
            years: {
              2020: { year: 2020, cropsPct: 54.2, pasturePct: 18.5, waterPct: 2.1, forestPct: 23.8, reforestationPct: 1.4, ndviMean: 0.68, carbonStockTonsHa: 82, lossAlertHectares: 120, notes: 'Ano base de referência. Safra com safra recorde de soja.' },
              2021: { year: 2021, cropsPct: 56.0, pasturePct: 16.8, waterPct: 2.0, forestPct: 23.5, reforestationPct: 1.7, ndviMean: 0.70, carbonStockTonsHa: 83, lossAlertHectares: 85, notes: 'Conversão de pastagens de baixa produtividade para lavouras.' },
              2022: { year: 2022, cropsPct: 58.1, pasturePct: 14.5, waterPct: 2.2, forestPct: 23.2, reforestationPct: 2.0, ndviMean: 0.72, carbonStockTonsHa: 85, lossAlertHectares: 40, notes: 'Introdução de ILPF (Integração Lavoura-Pecuária-Floresta).' },
              2023: { year: 2023, cropsPct: 59.8, pasturePct: 12.6, waterPct: 2.1, forestPct: 23.1, reforestationPct: 2.4, ndviMean: 0.74, carbonStockTonsHa: 88, lossAlertHectares: 22, notes: 'Estabilidade da vegetação nativa com plantio de eucalipto consorciado.' },
              2024: { year: 2024, cropsPct: 61.2, pasturePct: 10.9, waterPct: 2.1, forestPct: 23.0, reforestationPct: 2.8, ndviMean: 0.76, carbonStockTonsHa: 91, lossAlertHectares: 10, notes: 'Agricultura de precisão e ampliação das áreas de reflorestamento.' },
              2025: { year: 2025, cropsPct: 62.0, pasturePct: 9.8, waterPct: 2.2, forestPct: 22.9, reforestationPct: 3.1, ndviMean: 0.77, carbonStockTonsHa: 94, lossAlertHectares: 4, notes: 'Monitoramento contínuo em tempo real via Sentinel-2; desmatamento residual zero.' }
            }
          },
          {
            id: 'br_santarem',
            name: 'Santarém (Baixo Amazonas)',
            stateOrProvince: 'Pará',
            countryId: 'brazil',
            continentId: 'south_america',
            totalHectares: 98000,
            centerCoordinates: { lat: -2.443, lng: -54.708 },
            biome: 'Floresta Amazônica',
            previewUrl: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1200&q=80',
            historicalSummary: 'Fronteira com alta cobertura de floresta nativa primária, rios de grande vazão e programas de restauração ecológica da mata ciliar.',
            years: {
              2020: { year: 2020, cropsPct: 14.5, pasturePct: 12.0, waterPct: 8.5, forestPct: 63.2, reforestationPct: 1.8, ndviMean: 0.81, carbonStockTonsHa: 195, lossAlertHectares: 180, notes: 'Ano de fortes chuvas e vazão plena dos afluentes do Rio Tapajós.' },
              2021: { year: 2021, cropsPct: 15.2, pasturePct: 11.4, waterPct: 8.3, forestPct: 62.8, reforestationPct: 2.3, ndviMean: 0.81, carbonStockTonsHa: 194, lossAlertHectares: 130, notes: 'Projetos comunitários de regeneração florestal assistida.' },
              2022: { year: 2022, cropsPct: 15.9, pasturePct: 10.5, waterPct: 8.4, forestPct: 62.4, reforestationPct: 2.8, ndviMean: 0.82, carbonStockTonsHa: 196, lossAlertHectares: 75, notes: 'Acordo da Soja mantendo restrição estrita em áreas de desmate recente.' },
              2023: { year: 2023, cropsPct: 16.5, pasturePct: 9.8, waterPct: 8.1, forestPct: 62.1, reforestationPct: 3.5, ndviMean: 0.83, carbonStockTonsHa: 198, lossAlertHectares: 30, notes: 'Aceleração de projetos de créditos de carbono e reflorestamento com espécies nativas.' },
              2024: { year: 2024, cropsPct: 17.0, pasturePct: 9.0, waterPct: 8.2, forestPct: 61.8, reforestationPct: 4.0, ndviMean: 0.84, carbonStockTonsHa: 202, lossAlertHectares: 15, notes: 'Bacia hídrica estável com reflorestamento consolidando corredores ecológicos.' },
              2025: { year: 2025, cropsPct: 17.2, pasturePct: 8.3, waterPct: 8.3, forestPct: 61.6, reforestationPct: 4.6, ndviMean: 0.85, carbonStockTonsHa: 205, lossAlertHectares: 8, notes: 'Reflorestamento atinge 4.6% da paisagem regional com alto vigor vegetativo.' }
            }
          },
          {
            id: 'br_lem',
            name: 'Luís Eduardo Magalhães (Oeste Baiano / Matopiba)',
            stateOrProvince: 'Bahia',
            countryId: 'brazil',
            continentId: 'south_america',
            totalHectares: 110000,
            centerCoordinates: { lat: -12.095, lng: -45.795 },
            biome: 'Cerrado',
            previewUrl: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1200&q=80',
            historicalSummary: 'Planaltos do Matopiba com cultivo altamente tecnificado de algodão e grãos e preservação de reservas legais de Cerrado.',
            years: {
              2020: { year: 2020, cropsPct: 48.0, pasturePct: 11.5, waterPct: 1.5, forestPct: 37.8, reforestationPct: 1.2, ndviMean: 0.64, carbonStockTonsHa: 68, lossAlertHectares: 90, notes: 'Safra com irrigação por pivô central e reservas de Cerrado bem delimitadas.' },
              2021: { year: 2021, cropsPct: 49.5, pasturePct: 10.3, waterPct: 1.4, forestPct: 37.3, reforestationPct: 1.5, ndviMean: 0.65, carbonStockTonsHa: 69, lossAlertHectares: 60, notes: 'Modernização de barramentos de água para recarga de aquíferos.' },
              2022: { year: 2022, cropsPct: 51.0, pasturePct: 9.1, waterPct: 1.5, forestPct: 36.7, reforestationPct: 1.7, ndviMean: 0.67, carbonStockTonsHa: 71, lossAlertHectares: 35, notes: 'Expansão de sistemas de plantio direto na palha.' },
              2023: { year: 2023, cropsPct: 52.4, pasturePct: 8.0, waterPct: 1.4, forestPct: 36.2, reforestationPct: 2.0, ndviMean: 0.68, carbonStockTonsHa: 73, lossAlertHectares: 18, notes: 'Programas de enriquecimento vegetal e quebra-ventos com espécies arbóreas.' },
              2024: { year: 2024, cropsPct: 53.6, pasturePct: 7.1, waterPct: 1.5, forestPct: 35.6, reforestationPct: 2.2, ndviMean: 0.70, carbonStockTonsHa: 75, lossAlertHectares: 12, notes: 'Adoção massiva de biológicos na fixação de nitrogênio.' },
              2025: { year: 2025, cropsPct: 54.5, pasturePct: 6.3, waterPct: 1.5, forestPct: 35.2, reforestationPct: 2.5, ndviMean: 0.71, carbonStockTonsHa: 77, lossAlertHectares: 5, notes: 'Equilíbrio consolidado de uso do solo com CAR validado e rastreabilidade total.' }
            }
          },
          {
            id: 'br_rioverde',
            name: 'Rio Verde (Sudoeste Goiano)',
            stateOrProvince: 'Goiás',
            countryId: 'brazil',
            continentId: 'south_america',
            totalHectares: 85000,
            centerCoordinates: { lat: -17.792, lng: -50.923 },
            biome: 'Cerrado',
            previewUrl: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=1200&q=80',
            historicalSummary: 'Região com agroindústria consolidada, produção de proteína animal e recomposição florestal de topos de morro.',
            years: {
              2020: { year: 2020, cropsPct: 60.5, pasturePct: 16.2, waterPct: 2.5, forestPct: 18.6, reforestationPct: 2.2, ndviMean: 0.69, carbonStockTonsHa: 72, lossAlertHectares: 25, notes: 'Alta intensidade produtiva agroindustrial.' },
              2021: { year: 2021, cropsPct: 61.8, pasturePct: 14.7, waterPct: 2.4, forestPct: 18.5, reforestationPct: 2.6, ndviMean: 0.71, carbonStockTonsHa: 74, lossAlertHectares: 15, notes: 'Conversão de pastagens degradadas para lavoura de segunda safra.' },
              2022: { year: 2022, cropsPct: 63.0, pasturePct: 13.1, waterPct: 2.5, forestPct: 18.4, reforestationPct: 3.0, ndviMean: 0.73, carbonStockTonsHa: 77, lossAlertHectares: 10, notes: 'Reflorestamento de APP (Áreas de Preservação Permanente) com mudas nativas.' },
              2023: { year: 2023, cropsPct: 64.1, pasturePct: 11.6, waterPct: 2.4, forestPct: 18.4, reforestationPct: 3.5, ndviMean: 0.74, carbonStockTonsHa: 80, lossAlertHectares: 6, notes: 'Expansão de florestas plantadas de eucalipto para biomassa energética.' },
              2024: { year: 2024, cropsPct: 65.0, pasturePct: 10.3, waterPct: 2.5, forestPct: 18.3, reforestationPct: 3.9, ndviMean: 0.76, carbonStockTonsHa: 83, lossAlertHectares: 3, notes: 'Pecuária em semiconfinamento liberando áreas para agricultura e silvicultura.' },
              2025: { year: 2025, cropsPct: 65.8, pasturePct: 9.2, waterPct: 2.5, forestPct: 18.3, reforestationPct: 4.2, ndviMean: 0.77, carbonStockTonsHa: 86, lossAlertHectares: 1, notes: 'Reflorestamento supera 4% com alta captura de carbono e proteção dos mananciais.' }
            }
          }
        ]
      },
      {
        id: 'argentina',
        name: 'Argentina',
        flag: '🇦🇷',
        continentId: 'south_america',
        regions: [
          {
            id: 'ar_pergamino',
            name: 'Pergamino (Pampa Húmeda)',
            stateOrProvince: 'Buenos Aires',
            countryId: 'argentina',
            continentId: 'south_america',
            totalHectares: 75000,
            centerCoordinates: { lat: -33.89, lng: -60.57 },
            biome: 'Pampas / Pastagens Naturais',
            previewUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
            historicalSummary: 'Solo molisol de alta fertilidade natural com predomínio de lavouras de trigo, soja e milho sob plantio direto.',
            years: {
              2020: { year: 2020, cropsPct: 72.0, pasturePct: 18.0, waterPct: 3.2, forestPct: 5.5, reforestationPct: 1.3, ndviMean: 0.65, carbonStockTonsHa: 60, lossAlertHectares: 10, notes: 'Ano de boa precipitação estival.' },
              2021: { year: 2021, cropsPct: 73.2, pasturePct: 16.7, waterPct: 3.0, forestPct: 5.5, reforestationPct: 1.6, ndviMean: 0.67, carbonStockTonsHa: 61, lossAlertHectares: 8, notes: 'Intensificação de culturas de inverno (trigo e cevada).' },
              2022: { year: 2022, cropsPct: 74.0, pasturePct: 15.6, waterPct: 2.8, forestPct: 5.5, reforestationPct: 2.1, ndviMean: 0.63, carbonStockTonsHa: 62, lossAlertHectares: 5, notes: 'Período de seca La Niña com redução pontual de lâminas d\'água.' },
              2023: { year: 2023, cropsPct: 74.5, pasturePct: 14.8, waterPct: 3.1, forestPct: 5.4, reforestationPct: 2.2, ndviMean: 0.68, carbonStockTonsHa: 64, lossAlertHectares: 4, notes: 'Recuperação hídrica e ampliação de faixas de proteção florestal.' },
              2024: { year: 2024, cropsPct: 75.1, pasturePct: 13.9, waterPct: 3.2, forestPct: 5.4, reforestationPct: 2.4, ndviMean: 0.70, carbonStockTonsHa: 66, lossAlertHectares: 2, notes: 'Manejo regenerativo do solo com redução de fertilizantes químicos.' },
              2025: { year: 2025, cropsPct: 75.6, pasturePct: 13.2, waterPct: 3.3, forestPct: 5.4, reforestationPct: 2.5, ndviMean: 0.72, carbonStockTonsHa: 68, lossAlertHectares: 1, notes: 'Sistemas consorciados e retenção hídrica comprovada por radar Sentinel-1.' }
            }
          }
        ]
      }
    ]
  },
  {
    id: 'north_america',
    name: 'América do Norte',
    icon: '🗽',
    countries: [
      {
        id: 'usa',
        name: 'Estados Unidos',
        flag: '🇺🇸',
        continentId: 'north_america',
        regions: [
          {
            id: 'us_iowa',
            name: 'Iowa Central (Midwest Corn Belt)',
            stateOrProvince: 'Iowa',
            countryId: 'usa',
            continentId: 'north_america',
            totalHectares: 140000,
            centerCoordinates: { lat: 42.03, lng: -93.62 },
            biome: 'Pradarias Temperadas',
            previewUrl: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1200&q=80',
            historicalSummary: 'Cinturão de milho e soja norte-americano com práticas avançadas de conservação de bacias e faixas ripárias.',
            years: {
              2020: { year: 2020, cropsPct: 78.4, pasturePct: 6.8, waterPct: 2.9, forestPct: 9.8, reforestationPct: 2.1, ndviMean: 0.75, carbonStockTonsHa: 78, lossAlertHectares: 15, notes: 'Safra com máxima área cultivada e conservação sob programa USDA.' },
              2021: { year: 2021, cropsPct: 78.0, pasturePct: 6.5, waterPct: 3.0, forestPct: 9.9, reforestationPct: 2.6, ndviMean: 0.76, carbonStockTonsHa: 80, lossAlertHectares: 10, notes: 'Expansão de faixas de pradaria e reflorestamento ripário.' },
              2022: { year: 2022, cropsPct: 77.8, pasturePct: 6.2, waterPct: 3.1, forestPct: 9.9, reforestationPct: 3.0, ndviMean: 0.77, carbonStockTonsHa: 83, lossAlertHectares: 8, notes: 'Uso de culturas de cobertura de outono/inverno.' },
              2023: { year: 2023, cropsPct: 77.4, pasturePct: 6.0, waterPct: 3.0, forestPct: 10.0, reforestationPct: 3.6, ndviMean: 0.78, carbonStockTonsHa: 86, lossAlertHectares: 5, notes: 'Acréscimo de áreas de biorretenção e restauração de wetlands.' },
              2024: { year: 2024, cropsPct: 77.1, pasturePct: 5.8, waterPct: 3.1, forestPct: 10.0, reforestationPct: 4.0, ndviMean: 0.80, carbonStockTonsHa: 89, lossAlertHectares: 3, notes: 'Programas de crédito de carbono de solos agrícolas consolidados.' },
              2025: { year: 2025, cropsPct: 76.8, pasturePct: 5.6, waterPct: 3.2, forestPct: 10.0, reforestationPct: 4.4, ndviMean: 0.81, carbonStockTonsHa: 92, lossAlertHectares: 1, notes: 'Reflorestamento de encostas e bordas de rios atingindo meta climática.' }
            }
          }
        ]
      }
    ]
  },
  {
    id: 'europe',
    name: 'Europa',
    icon: '🏰',
    countries: [
      {
        id: 'france',
        name: 'França',
        flag: '🇫🇷',
        continentId: 'europe',
        regions: [
          {
            id: 'fr_aquitaine',
            name: 'Nouvelle-Aquitaine (Bacia Agrícola e Florestal)',
            stateOrProvince: 'Nouvelle-Aquitaine',
            countryId: 'france',
            continentId: 'europe',
            totalHectares: 92000,
            centerCoordinates: { lat: 44.83, lng: -0.57 },
            biome: 'Florestas Temperadas e Vinhedos',
            previewUrl: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1200&q=80',
            historicalSummary: 'Mosaico agroflorestal francês sob as diretrizes da PAC (Política Agrícola Comum) com foco em biodiversidade e silvicultura sustentável.',
            years: {
              2020: { year: 2020, cropsPct: 36.2, pasturePct: 22.0, waterPct: 3.5, forestPct: 33.1, reforestationPct: 5.2, ndviMean: 0.72, carbonStockTonsHa: 130, lossAlertHectares: 20, notes: 'Ano com boa umidade e início de metas de pacto ecológico europeu.' },
              2021: { year: 2021, cropsPct: 35.8, pasturePct: 21.5, waterPct: 3.6, forestPct: 33.3, reforestationPct: 5.8, ndviMean: 0.73, carbonStockTonsHa: 133, lossAlertHectares: 15, notes: 'Aumento de sebes florestais em divisas de parcelas agrícolas.' },
              2022: { year: 2022, cropsPct: 35.5, pasturePct: 20.8, waterPct: 3.4, forestPct: 33.5, reforestationPct: 6.8, ndviMean: 0.71, carbonStockTonsHa: 136, lossAlertHectares: 12, notes: 'Reflorestamento de pinheiros e carvalhos após períodos de calor.' },
              2023: { year: 2023, cropsPct: 35.0, pasturePct: 20.2, waterPct: 3.6, forestPct: 33.6, reforestationPct: 7.6, ndviMean: 0.75, carbonStockTonsHa: 140, lossAlertHectares: 8, notes: 'Agroecologia e diversificação de cultivares adaptadas.' },
              2024: { year: 2024, cropsPct: 34.6, pasturePct: 19.6, waterPct: 3.7, forestPct: 33.8, reforestationPct: 8.3, ndviMean: 0.77, carbonStockTonsHa: 144, lossAlertHectares: 4, notes: 'Florestamento atinge taxa histórica de cobertura contínua.' },
              2025: { year: 2025, cropsPct: 34.2, pasturePct: 19.0, waterPct: 3.8, forestPct: 34.0, reforestationPct: 9.0, ndviMean: 0.78, carbonStockTonsHa: 148, lossAlertHectares: 2, notes: 'Reflorestamento atinge 9.0% do território com manejo de corte seletivo.' }
            }
          }
        ]
      }
    ]
  },
  {
    id: 'asia_oceania',
    name: 'Ásia & Oceania',
    icon: '🌏',
    countries: [
      {
        id: 'indonesia',
        name: 'Indonésia',
        flag: '🇮🇩',
        continentId: 'asia_oceania',
        regions: [
          {
            id: 'id_riau',
            name: 'Riau (Sumatra Central)',
            stateOrProvince: 'Riau',
            countryId: 'indonesia',
            continentId: 'asia_oceania',
            totalHectares: 115000,
            centerCoordinates: { lat: 0.53, lng: 101.44 },
            biome: 'Florestas Tropicais Úmidas e Turfeiras',
            previewUrl: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1200&q=80',
            historicalSummary: 'Transição crítica de turfeiras com rígida moratória de desmatamento e programas de restauração de mangues e florestas equatoriais.',
            years: {
              2020: { year: 2020, cropsPct: 38.5, pasturePct: 4.2, waterPct: 7.8, forestPct: 46.5, reforestationPct: 3.0, ndviMean: 0.82, carbonStockTonsHa: 260, lossAlertHectares: 240, notes: 'Moratória e combate intensivo a queimadas sazonais.' },
              2021: { year: 2021, cropsPct: 38.2, pasturePct: 3.8, waterPct: 8.0, forestPct: 46.2, reforestationPct: 3.8, ndviMean: 0.82, carbonStockTonsHa: 262, lossAlertHectares: 160, notes: 'Restauração de canais hidrológicos em turfeiras degradadas.' },
              2022: { year: 2022, cropsPct: 38.0, pasturePct: 3.5, waterPct: 8.2, forestPct: 45.8, reforestationPct: 4.5, ndviMean: 0.83, carbonStockTonsHa: 265, lossAlertHectares: 90, notes: 'Certificação RSPO obrigatória para palmeiras de óleo existentes.' },
              2023: { year: 2023, cropsPct: 37.8, pasturePct: 3.2, waterPct: 8.3, forestPct: 45.5, reforestationPct: 5.2, ndviMean: 0.84, carbonStockTonsHa: 269, lossAlertHectares: 45, notes: 'Crescimento de áreas de reflorestamento em zonas úmidas protegidas.' },
              2024: { year: 2024, cropsPct: 37.5, pasturePct: 3.0, waterPct: 8.4, forestPct: 45.3, reforestationPct: 5.8, ndviMean: 0.86, carbonStockTonsHa: 274, lossAlertHectares: 20, notes: 'Zero desmatamento líquido declarado na concessão florestal monitorada.' },
              2025: { year: 2025, cropsPct: 37.2, pasturePct: 2.8, waterPct: 8.5, forestPct: 45.1, reforestationPct: 6.4, ndviMean: 0.87, carbonStockTonsHa: 280, lossAlertHectares: 9, notes: 'Reflorestamento de turfeiras atinge 6.4% com recuperação comprovada da fauna.' }
            }
          }
        ]
      }
    ]
  },
  {
    id: 'africa',
    name: 'África',
    icon: '🦁',
    countries: [
      {
        id: 'kenya',
        name: 'Quênia',
        flag: '🇰🇪',
        continentId: 'africa',
        regions: [
          {
            id: 'ke_riftvalley',
            name: 'Rift Valley / Mau Forest Complex',
            stateOrProvince: 'Rift Valley',
            countryId: 'kenya',
            continentId: 'africa',
            totalHectares: 88000,
            centerCoordinates: { lat: -0.30, lng: 35.95 },
            biome: 'Savanas e Florestas Montanas',
            previewUrl: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1200&q=80',
            historicalSummary: 'Torre de água do Quênia com iniciativa nacional de plantio de 15 bilhões de árvores e proteção dos recursos hídricos.',
            years: {
              2020: { year: 2020, cropsPct: 28.0, pasturePct: 32.5, waterPct: 4.8, forestPct: 31.2, reforestationPct: 3.5, ndviMean: 0.62, carbonStockTonsHa: 110, lossAlertHectares: 150, notes: 'Início da ofensiva governamental de recuperação florestal da cordilheira.' },
              2021: { year: 2021, cropsPct: 28.5, pasturePct: 31.0, waterPct: 4.9, forestPct: 31.0, reforestationPct: 4.6, ndviMean: 0.64, carbonStockTonsHa: 113, lossAlertHectares: 95, notes: 'Cercamento de reservas naturais e plantios de espécies autóctones.' },
              2022: { year: 2022, cropsPct: 28.8, pasturePct: 29.5, waterPct: 4.8, forestPct: 30.9, reforestationPct: 6.0, ndviMean: 0.66, carbonStockTonsHa: 117, lossAlertHectares: 50, notes: 'Reflorestamento comunitário com agrofloresta para subsistência.' },
              2023: { year: 2023, cropsPct: 29.0, pasturePct: 28.0, waterPct: 5.0, forestPct: 30.8, reforestationPct: 7.2, ndviMean: 0.68, carbonStockTonsHa: 121, lossAlertHectares: 25, notes: 'Aumento da umidade do solo e restauração de nascentes que alimentam o Lago Nakuru.' },
              2024: { year: 2024, cropsPct: 29.2, pasturePct: 26.5, waterPct: 5.1, forestPct: 30.8, reforestationPct: 8.4, ndviMean: 0.70, carbonStockTonsHa: 126, lossAlertHectares: 12, notes: 'Programa nacional de feriado de plantio de árvores acelerando o reflorestamento.' },
              2025: { year: 2025, cropsPct: 29.4, pasturePct: 25.1, waterPct: 5.2, forestPct: 30.8, reforestationPct: 9.5, ndviMean: 0.72, carbonStockTonsHa: 132, lossAlertHectares: 5, notes: 'Reflorestamento atinge 9.5% da paisagem; recuperação hidrológica consolidada.' }
            }
          }
        ]
      }
    ]
  }
];
