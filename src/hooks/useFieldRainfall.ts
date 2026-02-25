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

// Staggered fetch for all fields to avoid rate-limiting
export function useFieldRainfall(fields: Field[]) {
  const [rain, setRain] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const results: Record<string, number> = {};

    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      try {
        results[f.id] = await fetchRain24h(f.lat, f.lng);
      } catch {
        results[f.id] = 0;
      }
      setRain({ ...results });
      // Stagger requests by 500ms to avoid 429s
      if (i < fields.length - 1) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    setLoading(false);
  }, [fields]);

  useEffect(() => {
    if (fields.length > 0) loadAll();
    const interval = setInterval(loadAll, 600000); // refresh every 10 min
    return () => clearInterval(interval);
  }, [loadAll]);

  return { rain, loading };
}
