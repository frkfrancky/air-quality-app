export type AQILevel = 'bon' | 'moyen' | 'degrade' | 'mauvais' | 'tres_mauvais' | 'extremement_mauvais';

export interface AQIInfo {
  level: AQILevel;
  label: string;
  color: string;
  range: string;
  description: string;
  advice: string;
}

export interface Pollutant {
  id: string;
  name: string;
  shortName: string;
  value: number;
  unit: string;
  threshold: number;
  description: string;
}

export interface Station {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  aqi: number;
  aqiLevel: AQILevel;
  pollutants: Pollutant[];
  lastUpdated: string;
  type: 'urbaine' | 'periurbaine' | 'rurale' | 'trafic' | 'industrielle';
}

export interface HistoricalData {
  date: string;
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  o3: number;
}

export interface Alert {
  id: string;
  stationId: string;
  stationName: string;
  pollutant: string;
  level: AQILevel;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface ArduinoData {
  temperature: number;
  humidity: number;
  pressure: number;
  lux: number;
  red: number;
  green: number;
  blue: number;
  proximity: number;
  accel_x: number;
  accel_y: number;
  accel_z: number;
}

export type ArduinoConnectionState = 'idle' | 'loading' | 'connected' | 'error';
