import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, useMemo } from 'react';
import { Field, PlantRecord, SprayRecord, HarvestRecord, Bin, GrainMovement, SavedSeed, SprayRecipe } from '@/types/farm';
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
  grainMovements: GrainMovement[];
  savedSeeds: SavedSeed[];
  sprayRecipes: SprayRecipe[];
  addPlantRecord: (r: Omit<PlantRecord, 'id' | 'timestamp'>) => void;
  addSprayRecord: (r: Omit<SprayRecord, 'id' | 'timestamp'>) => void;
  addHarvestRecord: (r: Omit<HarvestRecord, 'id' | 'timestamp'>) => void;
  addGrainMovement: (r: Omit<GrainMovement, 'id'> & { timestamp?: number }) => void;
  deleteGrainMovements: (ids: string[]) => void;
  deletePlantRecords: (ids: string[]) => void;
  deleteSprayRecords: (ids: string[]) => void;
  deleteHarvestRecords: (ids: string[]) => void;
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
  signOut: () => void;
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
  const [grainMovements, setGrainMovements] = useState<GrainMovement[]>(() => loadFromStorage('ff_grain', []));
  const [savedSeeds, setSavedSeeds] = useState<SavedSeed[]>(() => loadFromStorage('ff_seeds', []));
  const [sprayRecipes, setSprayRecipes] = useState<SprayRecipe[]>(() => loadFromStorage('ff_recipes', []));

  // Initialize Supabase session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
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
          if (farmData.grainMovements) setGrainMovements(farmData.grainMovements);
          if (farmData.savedSeeds) setSavedSeeds(farmData.savedSeeds);
          if (farmData.sprayRecipes) setSprayRecipes(farmData.sprayRecipes);
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
      grainMovements,
      savedSeeds,
      sprayRecipes,
    };

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: session.user.id,
        farm_data: farmData,
        updated_at: new Date().toISOString()
      });

    if (error) console.error('Error syncing to cloud:', error);
  }, [session, fields, bins, plantRecords, sprayRecords, harvestRecords, grainMovements, savedSeeds, sprayRecipes]);

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

  const uid = () => crypto.randomUUID();

  const addPlantRecord = useCallback((r: Omit<PlantRecord, 'id' | 'timestamp'>) => {
    setPlantRecords(prev => [...prev, { ...r, id: uid(), timestamp: Date.now() }]);
  }, []);

  const addSprayRecord = useCallback((r: Omit<SprayRecord, 'id' | 'timestamp'>) => {
    setSprayRecords(prev => [...prev, { ...r, id: uid(), timestamp: Date.now() }]);
  }, []);

  const addHarvestRecord = useCallback((r: Omit<HarvestRecord, 'id' | 'timestamp'>) => {
    setHarvestRecords(prev => [...prev, { ...r, id: uid(), timestamp: Date.now() }]);
  }, []);

  const addGrainMovement = useCallback((r: Omit<GrainMovement, 'id'> & { timestamp?: number }) => {
    setGrainMovements(prev => [...prev, { ...r, id: uid(), timestamp: r.timestamp || Date.now() }]);
  }, []);

  const deleteGrainMovements = useCallback((ids: string[]) => {
    setGrainMovements(prev => prev.filter(r => !ids.includes(r.id)));
  }, []);

  const deletePlantRecords = useCallback((ids: string[]) => {
    setPlantRecords(prev => prev.filter(r => !ids.includes(r.id)));
  }, []);

  const deleteSprayRecords = useCallback((ids: string[]) => {
    setSprayRecords(prev => prev.filter(r => !ids.includes(r.id)));
  }, []);

  const deleteHarvestRecords = useCallback((ids: string[]) => {
    setHarvestRecords(prev => prev.filter(r => !ids.includes(r.id)));
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
    setFields(prev => prev.filter(f => f.id !== id));
  }, []);

  const addBin = useCallback((b: Omit<Bin, 'id'>) => {
    setBins(prev => [...prev, { ...b, id: uid() }]);
  }, []);

  const updateBin = useCallback((b: Bin) => {
    setBins(prev => prev.map(existing => existing.id === b.id ? b : existing));
  }, []);

  const deleteBin = useCallback((id: string) => {
    setBins(prev => prev.filter(b => b.id !== id));
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
      bins, plantRecords, sprayRecords, harvestRecords, grainMovements,
      savedSeeds, sprayRecipes,
      addPlantRecord, addSprayRecord, addHarvestRecord, addGrainMovement,
      deleteGrainMovements,
      deletePlantRecords, deleteSprayRecords, deleteHarvestRecords, getBinTotal,
      addField, updateField, deleteField,
      addBin, updateBin, deleteBin,
      addSeed, deleteSeed, addSprayRecipe, updateSprayRecipe, deleteSprayRecipe,
      signOut,
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

