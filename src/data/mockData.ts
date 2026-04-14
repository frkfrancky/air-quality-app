import { Station, HistoricalData, Alert, AQIInfo, AQILevel } from '../types';

export const AQI_LEVELS: Record<AQILevel, AQIInfo> = {
  bon: {
    level: 'bon',
    label: 'Bon',
    color: '#00C853',
    range: '0 - 50',
    description: 'La qualité de l\'air est satisfaisante.',
    advice: 'Profitez des activités en plein air !',
  },
  moyen: {
    level: 'moyen',
    label: 'Moyen',
    color: '#FFD600',
    range: '51 - 100',
    description: 'La qualité de l\'air est acceptable.',
    advice: 'Les personnes sensibles devraient limiter les efforts prolongés en extérieur.',
  },
  degrade: {
    level: 'degrade',
    label: 'Dégradé',
    color: '#FF6D00',
    range: '101 - 150',
    description: 'Des effets sur la santé peuvent être ressentis par les personnes sensibles.',
    advice: 'Limitez les activités physiques intenses en extérieur.',
  },
  mauvais: {
    level: 'mauvais',
    label: 'Mauvais',
    color: '#D50000',
    range: '151 - 200',
    description: 'Tout le monde peut commencer à ressentir des effets sur la santé.',
    advice: 'Évitez les activités physiques en extérieur.',
  },
  tres_mauvais: {
    level: 'tres_mauvais',
    label: 'Très mauvais',
    color: '#7B1FA2',
    range: '201 - 300',
    description: 'Alerte sanitaire : effets sur la santé sérieux.',
    advice: 'Restez à l\'intérieur. Évitez tout effort physique.',
  },
  extremement_mauvais: {
    level: 'extremement_mauvais',
    label: 'Extrêmement mauvais',
    color: '#4E0000',
    range: '> 300',
    description: 'Urgence sanitaire. Toute la population est affectée.',
    advice: 'Restez impérativement à l\'intérieur. Fermez les fenêtres.',
  },
};

export const getAQILevel = (aqi: number): AQILevel => {
  if (aqi <= 50) return 'bon';
  if (aqi <= 100) return 'moyen';
  if (aqi <= 150) return 'degrade';
  if (aqi <= 200) return 'mauvais';
  if (aqi <= 300) return 'tres_mauvais';
  return 'extremement_mauvais';
};

export const STATIONS: Station[] = [
  {
    id: '1',
    name: 'Station Paris Centre',
    city: 'Paris',
    latitude: 48.8566,
    longitude: 2.3522,
    aqi: 72,
    aqiLevel: 'moyen',
    lastUpdated: '2026-04-07T08:00:00',
    type: 'urbaine',
    pollutants: [
      { id: 'pm25', name: 'Particules fines', shortName: 'PM2.5', value: 18, unit: 'µg/m³', threshold: 25, description: 'Particules de diamètre inférieur à 2,5 µm' },
      { id: 'pm10', name: 'Particules', shortName: 'PM10', value: 34, unit: 'µg/m³', threshold: 50, description: 'Particules de diamètre inférieur à 10 µm' },
      { id: 'no2', name: 'Dioxyde d\'azote', shortName: 'NO₂', value: 52, unit: 'µg/m³', threshold: 200, description: 'Gaz irritant issu du trafic routier' },
      { id: 'o3', name: 'Ozone', shortName: 'O₃', value: 61, unit: 'µg/m³', threshold: 120, description: 'Polluant secondaire formé par réaction photochimique' },
      { id: 'so2', name: 'Dioxyde de soufre', shortName: 'SO₂', value: 8, unit: 'µg/m³', threshold: 350, description: 'Gaz issu de la combustion de combustibles soufrés' },
    ],
  },
  {
    id: '2',
    name: 'Station Lyon Confluence',
    city: 'Lyon',
    latitude: 45.7640,
    longitude: 4.8357,
    aqi: 45,
    aqiLevel: 'bon',
    lastUpdated: '2026-04-07T08:00:00',
    type: 'periurbaine',
    pollutants: [
      { id: 'pm25', name: 'Particules fines', shortName: 'PM2.5', value: 10, unit: 'µg/m³', threshold: 25, description: 'Particules de diamètre inférieur à 2,5 µm' },
      { id: 'pm10', name: 'Particules', shortName: 'PM10', value: 22, unit: 'µg/m³', threshold: 50, description: 'Particules de diamètre inférieur à 10 µm' },
      { id: 'no2', name: 'Dioxyde d\'azote', shortName: 'NO₂', value: 28, unit: 'µg/m³', threshold: 200, description: 'Gaz irritant issu du trafic routier' },
      { id: 'o3', name: 'Ozone', shortName: 'O₃', value: 45, unit: 'µg/m³', threshold: 120, description: 'Polluant secondaire formé par réaction photochimique' },
      { id: 'so2', name: 'Dioxyde de soufre', shortName: 'SO₂', value: 4, unit: 'µg/m³', threshold: 350, description: 'Gaz issu de la combustion de combustibles soufrés' },
    ],
  },
  {
    id: '3',
    name: 'Station Marseille Vieux-Port',
    city: 'Marseille',
    latitude: 43.2965,
    longitude: 5.3698,
    aqi: 115,
    aqiLevel: 'degrade',
    lastUpdated: '2026-04-07T08:00:00',
    type: 'trafic',
    pollutants: [
      { id: 'pm25', name: 'Particules fines', shortName: 'PM2.5', value: 28, unit: 'µg/m³', threshold: 25, description: 'Particules de diamètre inférieur à 2,5 µm' },
      { id: 'pm10', name: 'Particules', shortName: 'PM10', value: 56, unit: 'µg/m³', threshold: 50, description: 'Particules de diamètre inférieur à 10 µm' },
      { id: 'no2', name: 'Dioxyde d\'azote', shortName: 'NO₂', value: 95, unit: 'µg/m³', threshold: 200, description: 'Gaz irritant issu du trafic routier' },
      { id: 'o3', name: 'Ozone', shortName: 'O₃', value: 88, unit: 'µg/m³', threshold: 120, description: 'Polluant secondaire formé par réaction photochimique' },
      { id: 'so2', name: 'Dioxyde de soufre', shortName: 'SO₂', value: 15, unit: 'µg/m³', threshold: 350, description: 'Gaz issu de la combustion de combustibles soufrés' },
    ],
  },
  {
    id: '4',
    name: 'Station Bordeaux Lac',
    city: 'Bordeaux',
    latitude: 44.8378,
    longitude: -0.5792,
    aqi: 38,
    aqiLevel: 'bon',
    lastUpdated: '2026-04-07T08:00:00',
    type: 'rurale',
    pollutants: [
      { id: 'pm25', name: 'Particules fines', shortName: 'PM2.5', value: 8, unit: 'µg/m³', threshold: 25, description: 'Particules de diamètre inférieur à 2,5 µm' },
      { id: 'pm10', name: 'Particules', shortName: 'PM10', value: 18, unit: 'µg/m³', threshold: 50, description: 'Particules de diamètre inférieur à 10 µm' },
      { id: 'no2', name: 'Dioxyde d\'azote', shortName: 'NO₂', value: 20, unit: 'µg/m³', threshold: 200, description: 'Gaz irritant issu du trafic routier' },
      { id: 'o3', name: 'Ozone', shortName: 'O₃', value: 38, unit: 'µg/m³', threshold: 120, description: 'Polluant secondaire formé par réaction photochimique' },
      { id: 'so2', name: 'Dioxyde de soufre', shortName: 'SO₂', value: 3, unit: 'µg/m³', threshold: 350, description: 'Gaz issu de la combustion de combustibles soufrés' },
    ],
  },
  {
    id: '5',
    name: 'Station Lille Flandres',
    city: 'Lille',
    latitude: 50.6292,
    longitude: 3.0573,
    aqi: 162,
    aqiLevel: 'mauvais',
    lastUpdated: '2026-04-07T08:00:00',
    type: 'industrielle',
    pollutants: [
      { id: 'pm25', name: 'Particules fines', shortName: 'PM2.5', value: 42, unit: 'µg/m³', threshold: 25, description: 'Particules de diamètre inférieur à 2,5 µm' },
      { id: 'pm10', name: 'Particules', shortName: 'PM10', value: 78, unit: 'µg/m³', threshold: 50, description: 'Particules de diamètre inférieur à 10 µm' },
      { id: 'no2', name: 'Dioxyde d\'azote', shortName: 'NO₂', value: 120, unit: 'µg/m³', threshold: 200, description: 'Gaz irritant issu du trafic routier' },
      { id: 'o3', name: 'Ozone', shortName: 'O₃', value: 95, unit: 'µg/m³', threshold: 120, description: 'Polluant secondaire formé par réaction photochimique' },
      { id: 'so2', name: 'Dioxyde de soufre', shortName: 'SO₂', value: 45, unit: 'µg/m³', threshold: 350, description: 'Gaz issu de la combustion de combustibles soufrés' },
    ],
  },
];

export const HISTORICAL_DATA: HistoricalData[] = [
  { date: '01/04', aqi: 55, pm25: 12, pm10: 28, no2: 40, o3: 52 },
  { date: '02/04', aqi: 68, pm25: 16, pm10: 35, no2: 55, o3: 60 },
  { date: '03/04', aqi: 82, pm25: 22, pm10: 42, no2: 68, o3: 71 },
  { date: '04/04', aqi: 95, pm25: 26, pm10: 50, no2: 75, o3: 85 },
  { date: '05/04', aqi: 78, pm25: 19, pm10: 38, no2: 62, o3: 69 },
  { date: '06/04', aqi: 60, pm25: 14, pm10: 31, no2: 48, o3: 57 },
  { date: '07/04', aqi: 72, pm25: 18, pm10: 34, no2: 52, o3: 61 },
];

export const ALERTS: Alert[] = [
  {
    id: '1',
    stationId: '5',
    stationName: 'Station Lille Flandres',
    pollutant: 'PM2.5',
    level: 'mauvais',
    message: 'Dépassement du seuil de PM2.5 (42 µg/m³). Seuil OMS : 25 µg/m³.',
    timestamp: '2026-04-07T06:30:00',
    isRead: false,
  },
  {
    id: '2',
    stationId: '3',
    stationName: 'Station Marseille Vieux-Port',
    pollutant: 'PM10',
    level: 'degrade',
    message: 'Dépassement du seuil journalier de PM10 (56 µg/m³). Seuil : 50 µg/m³.',
    timestamp: '2026-04-07T07:15:00',
    isRead: false,
  },
  {
    id: '3',
    stationId: '5',
    stationName: 'Station Lille Flandres',
    pollutant: 'PM10',
    level: 'mauvais',
    message: 'Forte concentration de PM10 (78 µg/m³) détectée.',
    timestamp: '2026-04-07T05:00:00',
    isRead: true,
  },
];
