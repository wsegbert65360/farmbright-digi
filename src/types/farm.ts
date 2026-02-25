export interface Field {
  id: string;
  name: string;
  acreage: number;
  lat: number;
  lng: number;
  fsaFarmNumber?: string;
  fsaTractNumber?: string;
}

export interface PlantRecord {
  id: string;
  fieldId: string;
  fieldName: string;
  seedVariety: string;
  acreage: number;
  timestamp: number;
  // FSA compliance fields
  crop?: string;
  fsaFarmNumber?: string;
  fsaTractNumber?: string;
  intendedUse?: string;
  plantDate?: string;
}

export interface SprayRecord {
  id: string;
  fieldId: string;
  fieldName: string;
  product: string;
  windSpeed: number;
  temperature: number;
  timestamp: number;
  // Spray audit / personal license compliance
  applicatorName?: string;
  licenseNumber?: string;
  epaRegNumber?: string;
  applicationRate?: string;
  rateUnit?: string;
  targetPest?: string;
  windDirection?: string;
  relativeHumidity?: number;
  sprayDate?: string;
  // Regulatory compliance fields (2 CSR 70-25.120)
  startTime?: string;
  involvedTechnicians?: string;
  siteAddress?: string;
  treatedAreaSize?: string;
  totalAmountApplied?: string;
  isPremixed?: boolean;
}

export interface HarvestRecord {
  id: string;
  fieldId: string;
  fieldName: string;
  destination: 'bin' | 'town';
  binId?: string;
  moisturePercent: number;
  landlordSplitPercent: number;
  bushels: number;
  timestamp: number;
  // FSA compliance fields
  crop?: string;
  fsaFarmNumber?: string;
  fsaTractNumber?: string;
  harvestDate?: string;
}

export interface Bin {
  id: string;
  name: string;
  capacity: number;
}

export interface GrainMovement {
  id: string;
  binId: string;
  binName: string;
  type: 'in' | 'out';
  bushels: number;
  moisturePercent: number;
  sourceFieldName?: string;
  timestamp: number;
  price?: number; // Price per bushel
  destination?: string; // Buyer or location
}

export interface SavedSeed {
  id: string;
  name: string; // e.g. "DKC 64-35"
}

export interface SprayRecipeProduct {
  product: string;
  rate: string;
  rateUnit: string;
}

export interface SprayRecipe {
  id: string;
  name: string;
  products: SprayRecipeProduct[];
  applicatorName?: string;
  licenseNumber?: string;
  epaRegNumber?: string;
  targetPest?: string;
}

export type ActivityRecord =
  | { type: 'plant'; data: PlantRecord }
  | { type: 'spray'; data: SprayRecord }
  | { type: 'harvest'; data: HarvestRecord };
