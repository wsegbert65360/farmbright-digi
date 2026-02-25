import { Wind, Thermometer, Droplets, MapPin, Loader2 } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

export interface WeatherData {
  wind: number;
  temp: number;
  humidity: number;
  windDirection: string;
}

const DIRECTION_LABELS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

function degreesToDirection(deg: number): string {
  const idx = Math.round(deg / 22.5) % 16;
  return DIRECTION_LABELS[idx];
}

function fallbackWeather(): WeatherData {
  return { wind: 0, temp: 0, humidity: 0, windDirection: '—' };
}

async function fetchWeatherByCoords(lat: number, lng: number): Promise<WeatherData> {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`
  );
  if (!res.ok) throw new Error('Weather API error');
  const data = await res.json();
  const c = data.current;
  return {
    wind: Math.round(c.wind_speed_10m),
    temp: Math.round(c.temperature_2m),
    humidity: Math.round(c.relative_humidity_2m),
    windDirection: degreesToDirection(c.wind_direction_10m),
  };
}

async function geocodeZip(zip: string): Promise<{ lat: number; lng: number; name: string }> {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${zip}&count=1&language=en&format=json`
  );
  if (!res.ok) throw new Error('Geocoding error');
  const data = await res.json();
  if (!data.results?.length) throw new Error('Location not found');
  const r = data.results[0];
  return { lat: r.latitude, lng: r.longitude, name: r.name };
}

export async function fetchWeatherForZip(zip: string): Promise<WeatherData & { locationName: string }> {
  try {
    const geo = await geocodeZip(zip);
    const weather = await fetchWeatherByCoords(geo.lat, geo.lng);
    return { ...weather, locationName: geo.name };
  } catch {
    return { ...fallbackWeather(), locationName: 'Unknown' };
  }
}

export async function fetchWeatherForCoords(lat: number, lng: number): Promise<WeatherData> {
  try {
    return await fetchWeatherByCoords(lat, lng);
  } catch {
    return fallbackWeather();
  }
}

function loadZip(): string {
  try { return localStorage.getItem('ff_zip') || ''; } catch { return ''; }
}
function saveZip(zip: string) {
  localStorage.setItem('ff_zip', zip);
}

export default function WeatherBar() {
  const [zip, setZip] = useState(loadZip);
  const [inputZip, setInputZip] = useState(zip);
  const [weather, setWeather] = useState<WeatherData>(fallbackWeather);
  const [locationName, setLocationName] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (z: string) => {
    if (!z.trim()) return;
    setLoading(true);
    const result = await fetchWeatherForZip(z.trim());
    setWeather(result);
    setLocationName(result.locationName);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (zip) load(zip);
    const interval = setInterval(() => { if (zip) load(zip); }, 300000);
    return () => clearInterval(interval);
  }, [zip, load]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const z = inputZip.trim();
    if (z) { setZip(z); saveZip(z); load(z); }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-3 space-y-2">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <MapPin size={16} className="text-muted-foreground shrink-0" />
        <input
          value={inputZip}
          onChange={e => setInputZip(e.target.value)}
          placeholder="Enter zip code..."
          className="flex-1 bg-muted border border-border rounded-md px-3 py-1.5 text-foreground font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          maxLength={10}
        />
        <button
          type="submit"
          className="px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary rounded-md font-mono text-xs font-bold hover:bg-primary/20 transition-colors"
        >
          Set
        </button>
        {loading && <Loader2 size={16} className="text-primary animate-spin shrink-0" />}
      </form>

      {zip && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground">{locationName || zip}</span>
          <div className="flex items-center gap-4 text-foreground font-mono text-sm">
            <span className="flex items-center gap-1">
              <Wind size={14} className="text-spray" />
              {weather.wind} mph {weather.windDirection}
            </span>
            <span className="flex items-center gap-1">
              <Thermometer size={14} className="text-destructive" />
              {weather.temp}°F
            </span>
            <span className="flex items-center gap-1">
              <Droplets size={14} className="text-spray" />
              {weather.humidity}%
            </span>
          </div>
        </div>
      )}

      {!zip && (
        <p className="text-xs font-mono text-muted-foreground text-center">Enter a zip code for live weather</p>
      )}
    </div>
  );
}
