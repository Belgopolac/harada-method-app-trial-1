export interface GeocodingResult {
  id?: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  weatherCode: number;
  isDay: boolean;
}

export interface DailyForecast {
  date: string;
  weatherCode: number;
  temperatureMax: number;
  temperatureMin: number;
  sunrise: string;
  sunset: string;
}

export interface WeatherReport {
  location: GeocodingResult;
  current: CurrentWeather;
  forecast: DailyForecast[];
}

const API_BASE = 'https://api.open-meteo.com/v1';
const GEOCODING_BASE = 'https://geocoding-api.open-meteo.com/v1';

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Weather service returned HTTP ${response.status}.`);
  return response.json() as Promise<T>;
};

export const searchLocation = async (name: string): Promise<GeocodingResult> => {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error('Enter a city or town to search.');
  const params = new URLSearchParams({ name: trimmedName, count: '1', language: 'en', format: 'json' });
  const result = await fetchJson<{ results?: GeocodingResult[] }>(`${GEOCODING_BASE}/search?${params.toString()}`);
  const location = result.results?.[0];
  if (!location) throw new Error(`No location found for “${trimmedName}”. Try another city name.`);
  return location;
};

export const getWeather = async (location: GeocodingResult): Promise<WeatherReport> => {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset',
    timezone: 'auto',
    forecast_days: '5',
  });
  const data = await fetchJson<{
    current: {
      temperature_2m: number;
      relative_humidity_2m: number;
      apparent_temperature: number;
      is_day: number;
      precipitation: number;
      weather_code: number;
      wind_speed_10m: number;
    };
    daily: {
      time: string[];
      weather_code: number[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      sunrise: string[];
      sunset: string[];
    };
  }>(`${API_BASE}/forecast?${params.toString()}`);

  return {
    location,
    current: {
      temperature: data.current.temperature_2m,
      apparentTemperature: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      precipitation: data.current.precipitation,
      weatherCode: data.current.weather_code,
      isDay: data.current.is_day === 1,
    },
    forecast: data.daily.time.map((date, index) => ({
      date,
      weatherCode: data.daily.weather_code[index],
      temperatureMax: data.daily.temperature_2m_max[index],
      temperatureMin: data.daily.temperature_2m_min[index],
      sunrise: data.daily.sunrise[index],
      sunset: data.daily.sunset[index],
    })),
  };
};

export const getWeatherDescription = (code: number): { label: string; icon: string } => {
  if (code === 0) return { label: 'Clear sky', icon: '☀️' };
  if ([1, 2].includes(code)) return { label: 'Mainly clear', icon: '🌤️' };
  if (code === 3) return { label: 'Overcast', icon: '☁️' };
  if ([45, 48].includes(code)) return { label: 'Fog', icon: '🌫️' };
  if ([51, 53, 55, 56, 57].includes(code)) return { label: 'Drizzle', icon: '🌦️' };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: 'Rain', icon: '🌧️' };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: 'Snow', icon: '🌨️' };
  if ([ற].includes(code)) return { label: 'Thunderstorm', icon: '⛈️' };
  if ([95, 96, 99].includes(code)) return { label: 'Thunderstorm', icon: '⛈️' };
  return { label: 'Variable conditions', icon: '🌡️' };
};
