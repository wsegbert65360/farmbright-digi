import { WeatherData } from '../types/weather';

const API_KEY = import.meta.env.VITE_VISUALCROSSING_KEY || 'BJ8CSMU4Q2XCG53UQ5K5PH2Y3';
const BASE_URL = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline';

/**
 * Hardened Weather Service using Visual Crossing Timeline API.
 * Uses &unitGroup=us for inches/fahrenheit and &timezone=local for accurate local reporting.
 */
export const WeatherService = {
    /**
     * Fetches the 24-hour precipitation total for a given location (lat, lng).
     * Specifically pulls the 'precip' field from the daily summary (days[0]).
     */
    async fetchRain24h(lat: number, lng: number): Promise<number> {
        const location = `${lat},${lng}`;
        return this.fetchRainByLocation(location);
    },

    /**
     * Internal helper for rainfall fetch via location string.
     */
    async fetchRainByLocation(location: string): Promise<number> {
        try {
            const url = `${BASE_URL}/${location}/today?unitGroup=us&key=${API_KEY}&contentType=json&include=days&timezone=local`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Weather API error: ${response.statusText}`);
            }

            const data = await response.json();

            // Pulling precip from the daily summary (days[0]) for the current local day
            const precipValue = data.days?.[0]?.precip ?? 0;

            console.log(`[WeatherService] Raw Precip Value for ${location}: ${precipValue} inches`);

            return precipValue;
        } catch (error) {
            console.error('[WeatherService] Error fetching rainfall:', error);
            return 0;
        }
    },

    /**
     * Fetches current weather data (temp, humidity, wind) for the Weather Bar by location string (e.g. ZIP).
     */
    async fetchCurrentWeather(location: string): Promise<WeatherData & { locationName?: string }> {
        try {
            const url = `${BASE_URL}/${location}/today?unitGroup=us&key=${API_KEY}&contentType=json&include=current&timezone=local`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Weather API error: ${response.statusText}`);
            }

            const data = await response.json();
            const current = data.currentConditions;

            return {
                temp: Math.round(current.temp),
                humidity: Math.round(current.humidity),
                wind: Math.round(current.windspeed),
                windDirection: this.degreesToDirection(current.winddir),
                locationName: data.address // Visual Crossing returns the resolved address/location name
            };
        } catch (error) {
            console.error('[WeatherService] Error fetching current weather:', error);
            return {
                temp: 0,
                humidity: 0,
                wind: 0,
                windDirection: '—',
                locationName: 'Unknown'
            };
        }
    },

    /**
     * Helper to convert degrees to cardinal direction.
     */
    degreesToDirection(deg: number): string {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const idx = Math.round(deg / 22.5) % 16;
        return directions[idx];
    }
};
