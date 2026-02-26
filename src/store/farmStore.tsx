import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, useMemo } from 'react';
import { Field, PlantRecord, SprayRecord, HarvestRecord, HayHarvestRecord, Bin, GrainMovement, SavedSeed, SprayRecipe } from '@/types/farm';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

const DEFAULT_FIELDS: Field[] = [
  { id: 'f1', name: 'Back Forty', acreage: 40, lat: 41.88, lng: -93.09 },
  { id: 'f2', name: 'Creek Bottom', acreage: 65, lat: 41.87, lng: -93.10 },
  { id: 'f3', name: 'Hilltop', acreage: 80, lat: 41.89, lng: -93.08 },
  { id: 'f4', name: 'North 40', acreage: 40, lat: 41.90, lng: -93.09 },
  { id: 'f5', name: 'River Bottom', acreage: 120, lat: 41.86, lng: -93.11 },
  { id: 'f6', name: 'South Section', acreage: 160, lat: 41.85, lng: -93.09 },
];

const DEFAULT_BINS: Bin[] = [
  { id: 'b1', name: 'Bin #1', capacity: 10000 },
  { id: 'b2', name: 'Bin #2', capacity: 15000 },
  { id: 'b3', name: 'Bin #3', capacity: 8000 },
];

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    console.error(`Error loading from storage (${key}):`, error);
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving to storage:`, error);
  }
}

interface FarmState {
  session: Session | null;
  loading: boolean;
  fields: Field[];
  bins: Bin[];
  plantRecords: PlantRecord[];
  sprayRecords: SprayRecord[];
  harvestRecords: HarvestRecord[];
  hayHarvestRecords: HayHarvestRecord[];
  grainMovements: GrainMovement[];
  savedSeeds: SavedSeed[];
  sprayRecipes: SprayRecipe[];
  activeSeason: number;
  viewingSeason: number;
  setViewingSeason: (year: number) => void;
  rolloverToNewSeason: (year: number) => void;
  addPlantRecord: (r: Omit<PlantRecord, 'id' | 'timestamp'>) => void;
  updatePlantRecord: (r: PlantRecord) => void;
  addSprayRecord: (r: Omit<SprayRecord, 'id' | 'timestamp'>) => void;
  updateSprayRecord: (r: SprayRecord) => void;
  addHarvestRecord: (r: Omit<HarvestRecord, 'id' | 'timestamp'>) => void;
  updateHarvestRecord: (r: HarvestRecord) => void;
  addHayHarvestRecord: (r: Omit<HayHarvestRecord, 'id' | 'timestamp'>) => void;
  updateHayHarvestRecord: (r: HayHarvestRecord) => void;
  addGrainMovement: (r: Omit<GrainMovement, 'id'> & { timestamp?: number }) => void;
  updateGrainMovement: (r: GrainMovement) => void;
  deleteGrainMovements: (ids: string[]) => void;
  deletePlantRecords: (ids: string[]) => void;
  deleteSprayRecords: (ids: string[]) => void;
  deleteHarvestRecords: (ids: string[]) => void;
  deleteHayHarvestRecords: (ids: string[]) => void;
  getBinTotal: (binId: string) => number;
  addField: (f: Omit<Field, 'id'>) => void;
  updateField: (f: Field) => void;
  deleteField: (id: string) => void;
  addBin: (b: Omit<Bin, 'id'>) => void;
  updateBin: (b: Bin) => void;
  deleteBin: (id: string) => void;
  addSeed: (name: string) => void;
  deleteSeed: (id: string) => void;
  addSprayRecipe: (r: Omit<SprayRecipe, 'id'>) => void;
  updateSprayRecipe: (r: SprayRecipe) => void;
  deleteSprayRecipe: (id: string) => void;
  seedDemoData: () => void;
  signOut: () => void;
  farm_id: string | null;
}

const FarmContext = createContext<FarmState | null>(null);

export function FarmProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const [fields, setFields] = useState<Field[]>(() => loadFromStorage('ff_fields', DEFAULT_FIELDS));
  const [bins, setBins] = useState<Bin[]>(() => loadFromStorage('ff_bins', DEFAULT_BINS));
  const [plantRecords, setPlantRecords] = useState<PlantRecord[]>(() => loadFromStorage('ff_plant', []));
  const [sprayRecords, setSprayRecords] = useState<SprayRecord[]>(() => loadFromStorage('ff_spray', []));
  const [harvestRecords, setHarvestRecords] = useState<HarvestRecord[]>(() => loadFromStorage('ff_harvest', []));
  const [hayHarvestRecords, setHayHarvestRecords] = useState<HayHarvestRecord[]>(() => loadFromStorage('ff_hay', []));
  const [grainMovements, setGrainMovements] = useState<GrainMovement[]>(() => loadFromStorage('ff_grain', []));
  const [savedSeeds, setSavedSeeds] = useState<SavedSeed[]>(() => loadFromStorage('ff_seeds', []));
  const [sprayRecipes, setSprayRecipes] = useState<SprayRecipe[]>(() => loadFromStorage('ff_recipes', []));
  const [activeSeason, setActiveSeason] = useState<number>(() => loadFromStorage('ff_active_season', new Date().getFullYear()));
  const [viewingSeason, setViewingSeason] = useState<number>(() => loadFromStorage('ff_active_season', new Date().getFullYear()));
  const [farm_id, setFarmId] = useState<string | null>(() => loadFromStorage('ff_farm_id', null));

  // Initialize Supabase session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.id) {
        // Extract farm_id from JWT if present, or fetch from profiles
        const jwtFarmId = session.user.app_metadata?.farm_id || session.user.user_metadata?.farm_id;
        if (jwtFarmId) setFarmId(jwtFarmId);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch data from Supabase when session changes
  useEffect(() => {
    if (session) {
      const fetchData = async () => {
        setLoading(true);
        try {
          // Fetch all data in parallel from structured tables
          const [
            { data: fieldsData },
            { data: binsData },
            { data: plantData },
            { data: sprayData },
            { data: harvestData },
            { data: hayData },
            { data: grainData },
            { data: seedsData },
            { data: recipesData },
            { data: profileData }
          ] = await Promise.all([
            supabase.from('fields').select('*'),
            supabase.from('bins').select('*'),
            supabase.from('plant_records').select('*'),
            supabase.from('spray_records').select('*'),
            supabase.from('harvest_records').select('*'),
            supabase.from('hay_harvest_records').select('*'),
            supabase.from('grain_movements').select('*'),
            supabase.from('saved_seeds').select('*'),
            supabase.from('spray_recipes').select('*'),
            supabase.from('profiles').select('farm_id, active_season').single()
          ]);

          if (fieldsData) setFields(fieldsData);
          if (binsData) setBins(binsData);
          if (plantData) setPlantRecords(plantData);
          if (sprayData) setSprayRecords(sprayData);
          if (harvestData) setHarvestRecords(harvestData);
          if (hayData) setHayHarvestRecords(hayData);
          if (grainData) setGrainMovements(grainData);
          if (seedsData) setSavedSeeds(seedsData);
          if (recipesData) setSprayRecipes(recipesData);

          if (profileData) {
            if (profileData.farm_id) setFarmId(profileData.farm_id);
            if (profileData.active_season) {
              setActiveSeason(profileData.active_season);
              setViewingSeason(profileData.active_season);
            }
          }
        } catch (error) {
          console.error('Error fetching farm data:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [session]);

  // Note: Local storage persistence is maintained for offline resilience, 
  // but cloud sync is now handled individually by each CRUD operation.
  useEffect(() => { saveToStorage('ff_fields', fields); }, [fields]);
  useEffect(() => { saveToStorage('ff_bins', bins); }, [bins]);
  useEffect(() => { saveToStorage('ff_plant', plantRecords); }, [plantRecords]);
  useEffect(() => { saveToStorage('ff_spray', sprayRecords); }, [sprayRecords]);
  useEffect(() => { saveToStorage('ff_harvest', harvestRecords); }, [harvestRecords]);
  useEffect(() => { saveToStorage('ff_hay', hayHarvestRecords); }, [hayHarvestRecords]);
  useEffect(() => { saveToStorage('ff_grain', grainMovements); }, [grainMovements]);
  useEffect(() => { saveToStorage('ff_seeds', savedSeeds); }, [savedSeeds]);
  useEffect(() => { saveToStorage('ff_recipes', sprayRecipes); }, [sprayRecipes]);
  useEffect(() => { saveToStorage('ff_active_season', activeSeason); }, [activeSeason]);
  useEffect(() => { saveToStorage('ff_farm_id', farm_id); }, [farm_id]);

  const uid = () => crypto.randomUUID();

  const addPlantRecord = useCallback(async (r: Omit<PlantRecord, 'id' | 'timestamp'>) => {
    const id = uid();
    const timestamp = Date.now();
    const newRecord: PlantRecord = { ...r, id, timestamp, seasonYear: activeSeason };

    // Optimistic update
    setPlantRecords(prev => [...prev, newRecord]);

    const { error } = await supabase.from('plant_records').insert([{
      id,
      field_id: r.fieldId,
      field_name: r.fieldName,
      seed_variety: r.seedVariety,
      acreage: r.acreage,
      crop: r.crop,
      plant_date: r.plantDate,
      season_year: activeSeason,
      timestamp: new Date(timestamp).toISOString()
    }]);

    if (error) {
      console.error('Error adding plant record:', error);
      // Revert optimistic update on error
      setPlantRecords(prev => prev.filter(rec => rec.id !== id));
    }
  }, [activeSeason]);

  const updatePlantRecord = useCallback(async (r: PlantRecord) => {
    setPlantRecords(prev => prev.map(existing => existing.id === r.id ? r : existing));

    const { error } = await supabase.from('plant_records').upsert({
      id: r.id,
      field_id: r.fieldId,
      field_name: r.fieldName,
      seed_variety: r.seedVariety,
      acreage: r.acreage,
      crop: r.crop,
      plant_date: r.plantDate,
      season_year: r.seasonYear,
      timestamp: new Date(r.timestamp).toISOString()
    });

    if (error) console.error('Error updating plant record:', error);
  }, []);

  const addSprayRecord = useCallback(async (r: Omit<SprayRecord, 'id' | 'timestamp'>) => {
    const id = uid();
    const timestamp = Date.now();
    const newRecord: SprayRecord = { ...r, id, timestamp, seasonYear: activeSeason };

    setSprayRecords(prev => [...prev, newRecord]);

    const { error } = await supabase.from('spray_records').insert([{
      id,
      field_id: r.fieldId,
      field_name: r.fieldName,
      product: r.product,
      products: r.products,
      wind_speed: r.windSpeed,
      temperature: r.temperature,
      spray_date: r.sprayDate,
      start_time: r.startTime,
      equipment_id: r.equipmentId,
      applicator_name: r.applicatorName,
      license_number: r.licenseNumber,
      epa_reg_number: r.epaRegNumber,
      season_year: activeSeason,
      timestamp: new Date(timestamp).toISOString()
    }]);

    if (error) {
      console.error('Error adding spray record:', error);
      setSprayRecords(prev => prev.filter(rec => rec.id !== id));
    }
  }, [activeSeason]);

  const updateSprayRecord = useCallback(async (r: SprayRecord) => {
    setSprayRecords(prev => prev.map(existing => existing.id === r.id ? r : existing));

    const { error } = await supabase.from('spray_records').upsert({
      id: r.id,
      field_id: r.fieldId,
      field_name: r.fieldName,
      product: r.product,
      products: r.products,
      wind_speed: r.windSpeed,
      temperature: r.temperature,
      spray_date: r.sprayDate,
      start_time: r.startTime,
      equipment_id: r.equipmentId,
      applicator_name: r.applicatorName,
      license_number: r.licenseNumber,
      epa_reg_number: r.epaRegNumber,
      season_year: r.seasonYear,
      timestamp: new Date(r.timestamp).toISOString()
    });

    if (error) console.error('Error updating spray record:', error);
  }, []);

  const addHarvestRecord = useCallback(async (r: Omit<HarvestRecord, 'id' | 'timestamp'>) => {
    const id = uid();
    const timestamp = Date.now();
    const newRecord: HarvestRecord = { ...r, id, timestamp, seasonYear: activeSeason };

    setHarvestRecords(prev => [...prev, newRecord]);

    const { error } = await supabase.from('harvest_records').insert([{
      id,
      field_id: r.fieldId,
      field_name: r.fieldName,
      destination: r.destination,
      bin_id: r.binId,
      bushels: r.bushels,
      moisture_percent: r.moisturePercent,
      landlord_split_percent: r.landlordSplitPercent,
      harvest_date: r.harvestDate,
      season_year: activeSeason,
      timestamp: new Date(timestamp).toISOString()
    }]);

    if (error) {
      console.error('Error adding harvest record:', error);
      setHarvestRecords(prev => prev.filter(rec => rec.id !== id));
    }
  }, [activeSeason]);

  const updateHarvestRecord = useCallback(async (r: HarvestRecord) => {
    setHarvestRecords(prev => prev.map(existing => existing.id === r.id ? r : existing));

    const { error } = await supabase.from('harvest_records').upsert({
      id: r.id,
      field_id: r.fieldId,
      field_name: r.fieldName,
      destination: r.destination,
      bin_id: r.binId,
      bushels: r.bushels,
      moisture_percent: r.moisturePercent,
      landlord_split_percent: r.landlordSplitPercent,
      harvest_date: r.harvestDate,
      season_year: r.seasonYear,
      timestamp: new Date(r.timestamp).toISOString()
    });

    if (error) console.error('Error updating harvest record:', error);
  }, []);

  const addHayHarvestRecord = useCallback(async (r: Omit<HayHarvestRecord, 'id' | 'timestamp'>) => {
    const id = uid();
    const timestamp = Date.now();
    const newRecord: HayHarvestRecord = { ...r, id, timestamp, seasonYear: activeSeason };

    setHayHarvestRecords(prev => [...prev, newRecord]);

    const { error } = await supabase.from('hay_harvest_records').insert([{
      id,
      field_id: r.fieldId,
      field_name: r.fieldName,
      date: r.date,
      bale_count: r.baleCount,
      cutting_number: r.cuttingNumber,
      bale_type: r.baleType,
      temperature: r.temperature,
      conditions: r.conditions,
      season_year: activeSeason,
      timestamp: new Date(timestamp).toISOString()
    }]);

    if (error) {
      console.error('Error adding hay harvest record:', error);
      setHayHarvestRecords(prev => prev.filter(rec => rec.id !== id));
    }
  }, [activeSeason]);

  const updateHayHarvestRecord = useCallback(async (r: HayHarvestRecord) => {
    setHayHarvestRecords(prev => prev.map(existing => existing.id === r.id ? r : existing));

    const { error } = await supabase.from('hay_harvest_records').upsert({
      id: r.id,
      field_id: r.fieldId,
      field_name: r.fieldName,
      date: r.date,
      bale_count: r.baleCount,
      cutting_number: r.cuttingNumber,
      bale_type: r.baleType,
      temperature: r.temperature,
      conditions: r.conditions,
      season_year: r.seasonYear,
      timestamp: new Date(r.timestamp).toISOString()
    });

    if (error) console.error('Error updating hay harvest record:', error);
  }, []);

  const addGrainMovement = useCallback(async (r: Omit<GrainMovement, 'id'> & { timestamp?: number }) => {
    const id = uid();
    const timestamp = r.timestamp || Date.now();
    const newRecord: GrainMovement = { ...r, id, timestamp, seasonYear: activeSeason };

    setGrainMovements(prev => [...prev, newRecord]);

    const { error } = await supabase.from('grain_movements').insert([{
      id,
      bin_id: r.binId,
      bin_name: r.binName,
      type: r.type,
      bushels: r.bushels,
      moisture_percent: r.moisturePercent,
      source_field_name: r.sourceFieldName,
      destination: r.destination,
      price: r.price,
      season_year: activeSeason,
      timestamp: new Date(timestamp).toISOString()
    }]);

    if (error) {
      console.error('Error adding grain movement:', error);
      setGrainMovements(prev => prev.filter(rec => rec.id !== id));
    }
  }, [activeSeason]);

  const updateGrainMovement = useCallback(async (r: GrainMovement) => {
    setGrainMovements(prev => prev.map(existing => existing.id === r.id ? r : existing));

    const { error } = await supabase.from('grain_movements').upsert({
      id: r.id,
      bin_id: r.binId,
      bin_name: r.binName,
      type: r.type,
      bushels: r.bushels,
      moisture_percent: r.moisturePercent,
      source_field_name: r.sourceFieldName,
      destination: r.destination,
      price: r.price,
      season_year: r.seasonYear,
      timestamp: new Date(r.timestamp).toISOString()
    });

    if (error) console.error('Error updating grain movement:', error);
  }, []);

  const deleteGrainMovements = useCallback(async (ids: string[]) => {
    setGrainMovements(prev => prev.filter(r => !ids.includes(r.id)));
    const { error } = await supabase
      .from('grain_movements')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', ids);
    if (error) console.error('Error deleting grain movements:', error);
  }, []);

  const deletePlantRecords = useCallback(async (ids: string[]) => {
    setPlantRecords(prev => prev.filter(r => !ids.includes(r.id)));
    const { error } = await supabase
      .from('plant_records')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', ids);
    if (error) console.error('Error deleting plant records:', error);
  }, []);

  const deleteSprayRecords = useCallback(async (ids: string[]) => {
    setSprayRecords(prev => prev.map(r =>
      ids.includes(r.id) ? { ...r, deleted_at: new Date().toISOString() } : r
    ));
    const { error } = await supabase
      .from('spray_records')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', ids);
    if (error) console.error('Error deleting spray records:', error);
  }, []);

  const deleteHarvestRecords = useCallback(async (ids: string[]) => {
    setHarvestRecords(prev => prev.filter(r => !ids.includes(r.id)));
    const { error } = await supabase
      .from('harvest_records')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', ids);
    if (error) console.error('Error deleting harvest records:', error);
  }, []);

  const deleteHayHarvestRecords = useCallback(async (ids: string[]) => {
    setHayHarvestRecords(prev => prev.filter(r => !ids.includes(r.id)));
    const { error } = await supabase
      .from('hay_harvest_records')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', ids);
    if (error) console.error('Error deleting hay harvest records:', error);
  }, []);

  const getBinTotal = useCallback((binId: string) => {
    return grainMovements
      .filter(m => m.binId === binId)
      .reduce((total, m) => total + (m.type === 'in' ? m.bushels : -m.bushels), 0);
  }, [grainMovements]);

  const addField = useCallback(async (f: Omit<Field, 'id'>) => {
    const id = uid();
    setFields(prev => [...prev, { ...f, id }]);
    const { error } = await supabase.from('fields').insert([{ id, ...f }]);
    if (error) console.error('Error adding field:', error);
  }, []);

  const updateField = useCallback(async (f: Field) => {
    setFields(prev => prev.map(existing => existing.id === f.id ? f : existing));
    const { error } = await supabase.from('fields').upsert(f);
    if (error) console.error('Error updating field:', error);
  }, []);

  const deleteField = useCallback(async (id: string) => {
    setFields(prev => prev.map(f =>
      f.id === id ? { ...f, deleted_at: new Date().toISOString() } : f
    ));
    const { error } = await supabase.from('fields').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) console.error('Error deleting field:', error);
  }, []);

  const addBin = useCallback(async (b: Omit<Bin, 'id'>) => {
    const id = uid();
    setBins(prev => [...prev, { ...b, id }]);
    const { error } = await supabase.from('bins').insert([{ id, ...b }]);
    if (error) console.error('Error adding bin:', error);
  }, []);

  const updateBin = useCallback(async (b: Bin) => {
    setBins(prev => prev.map(existing => existing.id === b.id ? b : existing));
    const { error } = await supabase.from('bins').upsert(b);
    if (error) console.error('Error updating bin:', error);
  }, []);

  const deleteBin = useCallback(async (id: string) => {
    setBins(prev => prev.map(b =>
      b.id === id ? { ...b, deleted_at: new Date().toISOString() } : b
    ));
    const { error } = await supabase.from('bins').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) console.error('Error deleting bin:', error);
  }, []);

  const addSeed = useCallback(async (name: string) => {
    const id = uid();
    setSavedSeeds(prev => [...prev, { id, name }]);
    const { error } = await supabase.from('saved_seeds').insert([{ id, name }]);
    if (error) console.error('Error adding seed:', error);
  }, []);

  const deleteSeed = useCallback(async (id: string) => {
    setSavedSeeds(prev => prev.filter(s => s.id !== id));
    const { error } = await supabase.from('saved_seeds').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) console.error('Error deleting seed:', error);
  }, []);

  const addSprayRecipe = useCallback(async (r: Omit<SprayRecipe, 'id'>) => {
    const id = uid();
    setSprayRecipes(prev => [...prev, { ...r, id }]);
    const { error } = await supabase.from('spray_recipes').insert([{ id, ...r }]);
    if (error) console.error('Error adding spray recipe:', error);
  }, []);

  const updateSprayRecipe = useCallback(async (r: SprayRecipe) => {
    setSprayRecipes(prev => prev.map(existing => existing.id === r.id ? r : existing));
    const { error } = await supabase.from('spray_recipes').upsert(r);
    if (error) console.error('Error updating spray recipe:', error);
  }, []);

  const deleteSprayRecipe = useCallback(async (id: string) => {
    setSprayRecipes(prev => prev.filter(r => r.id !== id));
    const { error } = await supabase.from('spray_recipes').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) console.error('Error deleting spray recipe:', error);
  }, []);

  const seedDemoData = useCallback(() => {
    const allRecords = {
      plant: [] as PlantRecord[],
      spray: [] as SprayRecord[],
      harvest: [] as HarvestRecord[],
      grain: [] as GrainMovement[],
    };

    const generateForYear = (year: number, isHistorical: boolean) => {
      fields.forEach(f => {
        const isCorn = f.id.charCodeAt(1) % 2 === 0;
        const crop = isCorn ? 'Corn' : 'Soybeans';

        // 1. Planting (April/May)
        const plantDate = `${year}-05-${(10 + parseInt(f.id.slice(1))) % 28}`;
        allRecords.plant.push({
          id: uid(),
          fieldId: f.id,
          fieldName: f.name,
          seedVariety: isCorn ? 'DKC 64-35' : 'P31T77',
          acreage: f.acreage,
          crop,
          plantDate,
          timestamp: new Date(plantDate).getTime(),
          fsaFarmNumber: '3452',
          fsaTractNumber: '8821',
          fsaFieldNumber: f.id.slice(1),
          intendedUse: 'Grain',
          producerShare: f.id === 'f5' ? 50 : 100,
          irrigationPractice: f.id === 'f5' ? 'Irrigated' : 'Non-Irrigated',
          seasonYear: year
        });

        // 2. Spraying (June - Pass 1)
        const sprayDate1 = `${year}-06-12`;
        allRecords.spray.push({
          id: uid(),
          fieldId: f.id,
          fieldName: f.name,
          product: isCorn ? 'Harness Extra' : 'Authority First',
          products: [
            { product: isCorn ? 'Harness Extra' : 'Authority First', rate: isCorn ? '2.2' : '4.5', rateUnit: isCorn ? 'qt/ac' : 'oz/ac', epaRegNumber: isCorn ? '524-480' : '279-3246' },
            { product: 'AMS', rate: '1.5', rateUnit: 'lb/ac', epaRegNumber: 'Exempt' }
          ],
          windSpeed: 4,
          temperature: 78,
          timestamp: new Date(sprayDate1).getTime(),
          applicatorName: 'William Egbert',
          licenseNumber: '1234-567',
          equipmentId: 'Miller Nitro',
          epaRegNumber: isCorn ? '524-480' : '279-3246',
          targetPest: 'Grasses/Broadleaves',
          windDirection: 'SW',
          relativeHumidity: 65,
          sprayDate: sprayDate1,
          startTime: '08:15',
          treatedAreaSize: f.acreage.toString(),
          mixtureRate: '15 gal/ac',
          totalMixtureVolume: (f.acreage * 15).toString(),
          seasonYear: year
        });

        if (isHistorical) {
          // 3. Spraying (July - Pass 2)
          const sprayDate2 = `${year}-07-15`;
          allRecords.spray.push({
            id: uid(),
            fieldId: f.id,
            fieldName: f.name,
            product: 'Roundup PowerMAX',
            products: [
              { product: 'Roundup PowerMAX', rate: '32', rateUnit: 'oz/ac', epaRegNumber: '524-549' }
            ],
            windSpeed: 6,
            temperature: 88,
            timestamp: new Date(sprayDate2).getTime(),
            applicatorName: 'William Egbert',
            licenseNumber: '1234-567',
            equipmentId: 'Miller Nitro',
            epaRegNumber: '524-549',
            targetPest: 'Waterhemp',
            windDirection: 'S',
            relativeHumidity: 70,
            sprayDate: sprayDate2,
            startTime: '10:30',
            treatedAreaSize: f.acreage.toString(),
            mixtureRate: '12.5 gal/ac',
            totalMixtureVolume: (f.acreage * 12.5).toString(),
            seasonYear: year
          });

          // 4. Harvesting (October/November)
          const harvestDate = `${year}-10-${(15 + parseInt(f.id.slice(1))) % 28}`;
          const yieldPerAc = isCorn ? 210 : 65;
          const totalBu = f.acreage * yieldPerAc;
          allRecords.harvest.push({
            id: uid(),
            fieldId: f.id,
            fieldName: f.name,
            crop,
            bushels: totalBu,
            harvestDate,
            timestamp: new Date(harvestDate).getTime(),
            destination: 'bin',
            moisturePercent: isCorn ? 17.5 : 13.0,
            landlordSplitPercent: 0,
            fsaFarmNumber: '3452',
            fsaTractNumber: '8821',
            seasonYear: year
          });

          // 5. Grain Movements
          allRecords.grain.push({
            id: uid(),
            binId: isCorn ? 'b1' : 'b2',
            binName: isCorn ? 'Bin #1' : 'Bin #2',
            type: 'in',
            bushels: totalBu,
            moisturePercent: isCorn ? 17.5 : 13.0,
            sourceFieldName: f.name,
            timestamp: new Date(harvestDate).getTime(),
            seasonYear: year
          });
        }
      });
    };

    generateForYear(2025, true);
    generateForYear(2026, false); // Active season is just starting

    setPlantRecords(allRecords.plant);
    setSprayRecords(allRecords.spray);
    setHarvestRecords(allRecords.harvest);
    setGrainMovements(allRecords.grain);
  }, [fields]);

  const rolloverToNewSeason = useCallback(async (year: number) => {
    // 1. Force Backup (JSON export)
    const backupData = {
      fields, bins, plantRecords, sprayRecords, harvestRecords, hayHarvestRecords, grainMovements, savedSeeds, sprayRecipes, activeSeason,
      rolloverDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Pre_Season_Reset_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    // 2. Update active season in local state and Supabase
    setActiveSeason(year);
    setViewingSeason(year);

    if (session) {
      const { error } = await supabase
        .from('profiles')
        .update({ active_season: year })
        .eq('id', session.user.id);
      if (error) console.error('Error updating active season:', error);
    }
  }, [fields, bins, plantRecords, sprayRecords, harvestRecords, hayHarvestRecords, grainMovements, savedSeeds, sprayRecipes, activeSeason, session]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const sortedFields = useMemo(() =>
    [...fields].sort((a, b) => a.name.localeCompare(b.name)),
    [fields]
  );

  return (
    <FarmContext.Provider value={{
      session, loading,
      fields: sortedFields,
      bins, plantRecords, sprayRecords, harvestRecords, hayHarvestRecords, grainMovements,
      savedSeeds, sprayRecipes,
      activeSeason, viewingSeason, setViewingSeason, rolloverToNewSeason,
      addPlantRecord, updatePlantRecord, addSprayRecord, updateSprayRecord,
      addHarvestRecord, updateHarvestRecord,
      addHayHarvestRecord, updateHayHarvestRecord,
      addGrainMovement, updateGrainMovement,
      deleteGrainMovements,
      deletePlantRecords, deleteSprayRecords, deleteHarvestRecords, deleteHayHarvestRecords, getBinTotal,
      addField, updateField, deleteField,
      addBin, updateBin, deleteBin,
      addSeed, deleteSeed, addSprayRecipe, updateSprayRecipe, deleteSprayRecipe,
      seedDemoData,
      signOut,
      farm_id,
    }}>
      {children}
    </FarmContext.Provider>
  );
}


export function useFarm() {
  const ctx = useContext(FarmContext);
  if (!ctx) throw new Error('useFarm must be inside FarmProvider');
  return ctx;
}

