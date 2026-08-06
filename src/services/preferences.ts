import AsyncStorage from '@react-native-async-storage/async-storage';
import { CityLayers, DEFAULT_CITY_LAYERS } from '../components/CityScene';

// Couches affichées à l'ouverture de la page Ville, réglables depuis Paramètres et mémorisées
// (l'utilisateur peut toujours les activer/désactiver ensuite directement sur la page Ville — ce
// réglage ne fixe que leur état initial).
const DEFAULT_CITY_LAYERS_KEY = 'preferences.defaultCityLayers';

export async function loadDefaultCityLayers(): Promise<CityLayers> {
  try {
    const raw = await AsyncStorage.getItem(DEFAULT_CITY_LAYERS_KEY);
    if (!raw) return DEFAULT_CITY_LAYERS;
    return { ...DEFAULT_CITY_LAYERS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CITY_LAYERS;
  }
}

export async function saveDefaultCityLayers(layers: CityLayers): Promise<void> {
  await AsyncStorage.setItem(DEFAULT_CITY_LAYERS_KEY, JSON.stringify(layers));
}
