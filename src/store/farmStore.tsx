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
        const { data, error } = await supabase
          .from('profiles')
          .select('farm_data')
          .single();

        if (data?.farm_data) {
          const farmData = data.farm_data;
          if (farmData.fields) setFields(farmData.fields);
          if (farmData.bins) setBins(farmData.bins);
          if (farmData.plantRecords) setPlantRecords(farmData.plantRecords);
          if (farmData.sprayRecords) setSprayRecords(farmData.sprayRecords);
          if (farmData.harvestRecords) setHarvestRecords(farmData.harvestRecords);
          if (farmData.hayHarvestRecords) setHayHarvestRecords(farmData.hayHarvestRecords);
          if (farmData.grainMovements) setGrainMovements(farmData.grainMovements);
          if (farmData.savedSeeds) setSavedSeeds(farmData.savedSeeds);
          if (farmData.sprayRecipes) setSprayRecipes(farmData.sprayRecipes);
          if (farmData.activeSeason) {
            setActiveSeason(farmData.activeSeason);
            setViewingSeason(farmData.activeSeason);
          }
          if (farmData.farm_id) setFarmId(farmData.farm_id);
        } else if (!error && !data) {
          await syncToCloud();
        }
        setLoading(false);
      };
      fetchData();
    }
  }, [session]);

  const syncToCloud = useCallback(async () => {
    if (!session) return;

    const farmData = {
      fields,
      bins,
      plantRecords,
      sprayRecords,
      harvestRecords,
      hayHarvestRecords,
      grainMovements,
      savedSeeds,
      sprayRecipes,
      activeSeason,
      farm_id,
    };

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: session.user.id,
        farm_data: farmData,
        updated_at: new Date().toISOString()
      });

    if (error) console.error('Error syncing to cloud:', error);
  }, [session, fields, bins, plantRecords, sprayRecords, harvestRecords, hayHarvestRecords, grainMovements, savedSeeds, sprayRecipes, activeSeason]);

  // Save to storage (local and cloud)
  useEffect(() => {
    saveToStorage('ff_fields', fields);
    if (session) syncToCloud();
  }, [fields, session]);

  useEffect(() => {
    saveToStorage('ff_bins', bins);
    if (session) syncToCloud();
  }, [bins, session]);

  useEffect(() => {
    saveToStorage('ff_plant', plantRecords);
    if (session) syncToCloud();
  }, [plantRecords, session]);

  useEffect(() => {
    saveToStorage('ff_spray', sprayRecords);
    if (session) syncToCloud();
  }, [sprayRecords, session]);

  useEffect(() => {
    saveToStorage('ff_harvest', harvestRecords);
    if (session) syncToCloud();
  }, [harvestRecords, session]);

  useEffect(() => {
    saveToStorage('ff_hay', hayHarvestRecords);
    if (session) syncToCloud();
  }, [hayHarvestRecords, session]);

  useEffect(() => {
    saveToStorage('ff_grain', grainMovements);
    if (session) syncToCloud();
  }, [grainMovements, session]);

  useEffect(() => {
    saveToStorage('ff_seeds', savedSeeds);
    if (session) syncToCloud();
  }, [savedSeeds, session]);

  useEffect(() => {
    saveToStorage('ff_recipes', sprayRecipes);
    if (session) syncToCloud();
  }, [sprayRecipes, session]);

  useEffect(() => {
    saveToStorage('ff_active_season', activeSeason);
    if (session) syncToCloud();
  }, [activeSeason, session]);

  useEffect(() => {
    saveToStorage('ff_farm_id', farm_id);
    if (session) syncToCloud();
  }, [farm_id, session]);

  const uid = () => crypto.randomUUID();

  const addPlantRecord = useCallback((r: Omit<PlantRecord, 'id' | 'timestamp'>) => {
    setPlantRecords(prev => [...prev, { ...r, id: uid(), timestamp: Date.now(), seasonYear: activeSeason }]);
  }, [activeSeason]);

  const updatePlantRecord = useCallback((r: PlantRecord) => {
    setPlantRecords(prev => prev.map(existing => existing.id === r.id ? r : existing));
  }, []);

  const addSprayRecord = useCallback((r: Omit<SprayRecord, 'id' | 'timestamp'>) => {
    setSprayRecords(prev => [...prev, { ...r, id: uid(), timestamp: Date.now(), seasonYear: activeSeason }]);
  }, [activeSeason]);

  const updateSprayRecord = useCallback((r: SprayRecord) => {
    setSprayRecords(prev => prev.map(existing => existing.id === r.id ? r : existing));
  }, []);

  const addHarvestRecord = useCallback((r: Omit<HarvestRecord, 'id' | 'timestamp'>) => {
    setHarvestRecords(prev => [...prev, { ...r, id: uid(), timestamp: Date.now(), seasonYear: activeSeason }]);
  }, [activeSeason]);

  const updateHarvestRecord = useCallback((r: HarvestRecord) => {
    setHarvestRecords(prev => prev.map(existing => existing.id === r.id ? r : existing));
  }, []);

  const addHayHarvestRecord = useCallback((r: Omit<HayHarvestRecord, 'id' | 'timestamp'>) => {
    setHayHarvestRecords(prev => [...prev, { ...r, id: uid(), timestamp: Date.now(), seasonYear: activeSeason }]);
  }, [activeSeason]);

  const updateHayHarvestRecord = useCallback((r: HayHarvestRecord) => {
    setHayHarvestRecords(prev => prev.map(existing => existing.id === r.id ? r : existing));
  }, []);

  const addGrainMovement = useCallback((r: Omit<GrainMovement, 'id'> & { timestamp?: number }) => {
    setGrainMovements(prev => [...prev, { ...r, id: uid(), timestamp: r.timestamp || Date.now(), seasonYear: activeSeason }]);
  }, [activeSeason]);

  const updateGrainMovement = useCallback((r: GrainMovement) => {
    setGrainMovements(prev => prev.map(existing => existing.id === r.id ? r : existing));
  }, []);

  const deleteGrainMovements = useCallback((ids: string[]) => {
    setGrainMovements(prev => prev.filter(r => !ids.includes(r.id)));
  }, []);

  const deletePlantRecords = useCallback((ids: string[]) => {
    setPlantRecords(prev => prev.filter(r => !ids.includes(r.id)));
  }, []);

  const deleteSprayRecords = useCallback((ids: string[]) => {
    setSprayRecords(prev => prev.map(r =>
      ids.includes(r.id) ? { ...r, deleted_at: new Date().toISOString() } : r
    ));
  }, []);

  const deleteHarvestRecords = useCallback((ids: string[]) => {
    setHarvestRecords(prev => prev.filter(r => !ids.includes(r.id)));
  }, []);

  const deleteHayHarvestRecords = useCallback((ids: string[]) => {
    setHayHarvestRecords(prev => prev.filter(r => !ids.includes(r.id)));
  }, []);

  const getBinTotal = useCallback((binId: string) => {
    return grainMovements
      .filter(m => m.binId === binId)
      .reduce((total, m) => total + (m.type === 'in' ? m.bushels : -m.bushels), 0);
  }, [grainMovements]);

  const addField = useCallback((f: Omit<Field, 'id'>) => {
    setFields(prev => [...prev, { ...f, id: uid() }]);
  }, []);

  const updateField = useCallback((f: Field) => {
    setFields(prev => prev.map(existing => existing.id === f.id ? f : existing));
  }, []);

  const deleteField = useCallback((id: string) => {
    setFields(prev => prev.map(f =>
      f.id === id ? { ...f, deleted_at: new Date().toISOString() } : f
    ));
  }, []);

  const addBin = useCallback((b: Omit<Bin, 'id'>) => {
    setBins(prev => [...prev, { ...b, id: uid() }]);
  }, []);

  const updateBin = useCallback((b: Bin) => {
    setBins(prev => prev.map(existing => existing.id === b.id ? b : existing));
  }, []);

  const deleteBin = useCallback((id: string) => {
    setBins(prev => prev.map(b =>
      b.id === id ? { ...b, deleted_at: new Date().toISOString() } : b
    ));
  }, []);

  const addSeed = useCallback((name: string) => {
    setSavedSeeds(prev => [...prev, { id: uid(), name }]);
  }, []);

  const deleteSeed = useCallback((id: string) => {
    setSavedSeeds(prev => prev.filter(s => s.id !== id));
  }, []);

  const addSprayRecipe = useCallback((r: Omit<SprayRecipe, 'id'>) => {
    setSprayRecipes(prev => [...prev, { ...r, id: uid() }]);
  }, []);

  const updateSprayRecipe = useCallback((r: SprayRecipe) => {
    setSprayRecipes(prev => prev.map(existing => existing.id === r.id ? r : existing));
  }, []);

  const deleteSprayRecipe = useCallback((id: string) => {
    setSprayRecipes(prev => prev.filter(r => r.id !== id));
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

  const rolloverToNewSeason = useCallback((year: number) => {
    // 1. Force Backup (Database Hardening)
    const backupData = {
      fields, bins, plantRecords, sprayRecords, harvestRecords, grainMovements, savedSeeds, sprayRecipes, activeSeason,
      rolloverDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Pre_Season_Reset_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    // 2. Archive & Reset
    // We already tagged everything with seasonYear, so we just reset the active season marker
    // and clear fields that shouldn't persist if they are season-specific.
    // The prompt says "clear active dashboard", so we'll actually keep the historical records 
    // in the state but the UI will filter them by activeSeason soon.

    // Update active season
    setActiveSeason(year);
    setViewingSeason(year);
  }, [fields, bins, plantRecords, sprayRecords, harvestRecords, grainMovements, savedSeeds, sprayRecipes, activeSeason]);

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

