import { WeatherCondition } from '../components/CityScene';

// Open-Meteo : gratuit, sans clé API. https://open-meteo.com/en/docs/air-quality-api

export interface OpenMeteoAirQuality {
  aqi: number;
  pm25: number;
  pm10: number;
  ozone: number;
}

export async function fetchAirQuality(latitude: number, longitude: number): Promise<OpenMeteoAirQuality> {
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=pm2_5,pm10,ozone,us_aqi`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Échec de la requête qualité de l'air");
  }
  const data = await response.json();
  const current = data.current ?? {};

  return {
    // us_aqi suit l'échelle EPA (0-500) utilisée par getAQILevel/AQI_LEVELS dans data/mockData.ts.
    aqi: current.us_aqi ?? 0,
    pm25: current.pm2_5 ?? 0,
    pm10: current.pm10 ?? 0,
    ozone: current.ozone ?? 0,
  };
}

// Codes météo WMO renvoyés par Open-Meteo (https://open-meteo.com/en/docs), regroupés vers les
// 4 conditions gérées par CityScene.
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);
const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);
const CLOUDY_CODES = new Set([2, 3, 45, 48]);

function mapWeatherCode(code: number): WeatherCondition {
  if (SNOW_CODES.has(code)) return 'snowy';
  if (RAIN_CODES.has(code)) return 'rainy';
  if (CLOUDY_CODES.has(code)) return 'cloudy';
  return 'sunny'; // 0 (ciel clair), 1 (généralement clair) et tout code inconnu
}

export interface OpenMeteoWeather {
  condition: WeatherCondition;
  /** Décalage UTC du lieu, en minutes (ex. 120 pour UTC+2), pour afficher son heure locale. */
  utcOffsetMinutes: number;
}

export async function fetchWeatherCondition(latitude: number, longitude: number): Promise<OpenMeteoWeather> {
  // `timezone=auto` fait renvoyer par Open-Meteo le décalage UTC réel du point demandé plutôt que GMT.
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=weather_code&timezone=auto`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Échec de la requête météo');
  }
  const data = await response.json();
  const code = data.current?.weather_code ?? 0;
  return {
    condition: mapWeatherCode(code),
    utcOffsetMinutes: Math.round((data.utc_offset_seconds ?? 0) / 60),
  };
}
