import { useState, useEffect, useCallback } from 'react';
import { Field } from '@/types/farm';

// Fetch 24h rainfall for a single field (inches)
async function fetchRain24h(lat: number, lng: number): Promise<number> {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=precipitation&past_hours=24&forecast_hours=0&precipitation_unit=inch&timezone=auto`
  );
  if (!res.ok) throw new Error('Rain API error');
  const data = await res.json();
  const precip: number[] = data.hourly?.precipitation || [];
  return precip.reduce((sum, v) => sum + (v || 0), 0);
}

// Cache to prevent multiple components from triggering the same fetch
const rainCache: Record<string, { value: number; timestamp: number }> = {};
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Staggered fetch for all fields to avoid rate-limiting
export function useFieldRainfall(fields: Field[]) {
  const [rain, setRain] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const loadAll = useCallback(async () => {
    if (loading || fields.length === 0) return;
    setLoading(true);

    const results: Record<string, number> = { ...rain };
    const now = Date.now();

    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];

      // Check cache first
      if (rainCache[f.id] && (now - rainCache[f.id].timestamp < CACHE_TTL)) {
        results[f.id] = rainCache[f.id].value;
        continue;
      }

      try {
        console.log(`Fetching rain for field ${f.name}...`);
        const value = await fetchRain24h(f.lat, f.lng);
        results[f.id] = value;
        rainCache[f.id] = { value, timestamp: now };
      } catch (err) {
        console.warn(`Rain fetch failed for ${f.id}:`, err);
        results[f.id] = results[f.id] || 0;
      }

      // Update state incrementally
      setRain({ ...results });

      // Stagger requests more aggressively (1 second) to avoid 429s
      if (i < fields.length - 1) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    setLoading(false);
  }, [fields, loading, rain]);

  useEffect(() => {
    // Only run if we don't have data for all fields or if cache is stale
    const needsUpdate = fields.some(f => !rainCache[f.id] || (Date.now() - rainCache[f.id].timestamp > CACHE_TTL));

    if (needsUpdate) {
      const timeout = setTimeout(loadAll, 1000); // Small delay to let UI settle
      return () => clearTimeout(timeout);
    }
  }, [fields.length]); // Only run when field count changes or on mount

  return { rain, loading };
}
