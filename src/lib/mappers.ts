import {
    PlantRecord, SprayRecord, HarvestRecord, HayHarvestRecord,
    GrainMovement, Field, Bin, SavedSeed, SprayRecipe
} from '../types/farm';

export const mapPlantFromDb = (db: any): PlantRecord => ({
    id: db.id,
    fieldId: db.field_id,
    fieldName: db.field_name,
    seedVariety: db.seed_variety,
    acreage: db.acreage,
    crop: db.crop,
    plantDate: db.plant_date,
    fsaFarmNumber: db.fsa_farm_number,
    fsaTractNumber: db.fsa_tract_number,
    fsaFieldNumber: db.fsa_field_number,
    intendedUse: db.intended_use,
    producerShare: db.producer_share,
    irrigationPractice: db.irrigation_practice,
    seasonYear: db.season_year,
    timestamp: new Date(db.timestamp).getTime(),
    farm_id: db.farm_id,
    deleted_at: db.deleted_at
});

export const mapSprayFromDb = (db: any): SprayRecord => ({
    id: db.id,
    fieldId: db.field_id,
    fieldName: db.field_name,
    product: db.product,
    products: db.products,
    windSpeed: db.wind_speed,
    temperature: db.temperature,
    sprayDate: db.spray_date,
    startTime: db.start_time,
    equipmentId: db.equipment_id,
    applicatorName: db.applicator_name,
    licenseNumber: db.license_number,
    epaRegNumber: db.epa_reg_number,
    seasonYear: db.season_year,
    timestamp: new Date(db.timestamp).getTime(),
    farm_id: db.farm_id,
    deleted_at: db.deleted_at,
    targetPest: db.target_pest,
    windDirection: db.wind_direction,
    relativeHumidity: db.relative_humidity,
    treatedAreaSize: db.treated_area_size,
    totalAmountApplied: db.total_amount_applied,
    involvedTechnicians: db.involved_technicians,
    mixtureRate: db.mixture_rate,
    totalMixtureVolume: db.total_mixture_volume
});

export const mapHarvestFromDb = (db: any): HarvestRecord => ({
    id: db.id,
    fieldId: db.field_id,
    fieldName: db.field_name,
    destination: db.destination,
    binId: db.bin_id,
    bushels: db.bushels,
    moisturePercent: db.moisture_percent,
    landlordSplitPercent: db.landlord_split_percent,
    harvestDate: db.harvest_date,
    fsaFarmNumber: db.fsa_farm_number,
    fsaTractNumber: db.fsa_tract_number,
    seasonYear: db.season_year,
    timestamp: new Date(db.timestamp).getTime(),
    crop: db.crop,
    farm_id: db.farm_id,
    deleted_at: db.deleted_at
});

export const mapHayFromDb = (db: any): HayHarvestRecord => ({
    id: db.id,
    fieldId: db.field_id,
    fieldName: db.field_name,
    date: db.date,
    baleCount: db.bale_count,
    cuttingNumber: db.cutting_number,
    baleType: db.bale_type,
    temperature: db.temperature,
    conditions: db.conditions,
    seasonYear: db.season_year,
    timestamp: new Date(db.timestamp).getTime(),
    farm_id: db.farm_id,
    deleted_at: db.deleted_at
});

export const mapGrainFromDb = (db: any): GrainMovement => ({
    id: db.id,
    binId: db.bin_id,
    binName: db.bin_name,
    type: db.type,
    bushels: db.bushels,
    moisturePercent: db.moisture_percent,
    sourceFieldName: db.source_field_name,
    destination: db.destination,
    price: db.price,
    seasonYear: db.season_year,
    timestamp: new Date(db.timestamp).getTime(),
    farm_id: db.farm_id,
    deleted_at: db.deleted_at
});

export const mapFieldFromDb = (db: any): Field => ({
    id: db.id,
    name: db.name,
    acreage: db.acreage,
    lat: db.lat,
    lng: db.lng,
    fsaFarmNumber: db.fsa_farm_number,
    fsaTractNumber: db.fsa_tract_number,
    fsaFieldNumber: db.fsa_field_number,
    producerShare: db.producer_share,
    irrigationPractice: db.irrigation_practice,
    intendedUse: db.intended_use,
    farm_id: db.farm_id,
    deleted_at: db.deleted_at
});

export const mapBinFromDb = (db: any): Bin => ({
    id: db.id,
    name: db.name,
    capacity: db.capacity,
    farm_id: db.farm_id,
    deleted_at: db.deleted_at
});

export const mapSeedFromDb = (db: any): SavedSeed => ({
    id: db.id,
    name: db.name,
    farm_id: db.farm_id,
    deleted_at: db.deleted_at
});

export const mapRecipeFromDb = (db: any): SprayRecipe => ({
    id: db.id,
    name: db.name,
    products: db.products,
    applicatorName: db.applicator_name,
    licenseNumber: db.license_number,
    targetPest: db.target_pest,
    epaRegNumber: db.epa_reg_number,
    farm_id: db.farm_id,
    deleted_at: db.deleted_at
});
