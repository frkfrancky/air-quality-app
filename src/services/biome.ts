import {
  LAND_MASK_BASE64,
  LAND_MASK_RESOLUTION_DEG,
  LAND_MASK_LAT_CELLS,
  LAND_MASK_LON_CELLS,
} from '../data/landMask';
import { estimateTrafficIntensity } from './offlineTraffic';

export type Biome = 'ville' | 'nature' | 'ocean';

// Décodage base64 -> octets écrit à la main : ni `atob` (absent de Hermes sur certaines versions
// de React Native) ni `Buffer` (absent côté web) ne sont garantis disponibles sur toutes les
// plateformes ciblées par ce projet.
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/=+$/, '');
  const byteLength = Math.floor((clean.length * 6) / 8);
  const bytes = new Uint8Array(byteLength);

  let bitBuffer = 0;
  let bitCount = 0;
  let byteIndex = 0;

  for (let i = 0; i < clean.length; i++) {
    const value = BASE64_CHARS.indexOf(clean[i]);
    bitBuffer = (bitBuffer << 6) | value;
    bitCount += 6;

    if (bitCount >= 8) {
      bitCount -= 8;
      bytes[byteIndex++] = (bitBuffer >> bitCount) & 0xff;
    }
  }

  return bytes;
}

const landMaskBytes = base64ToBytes(LAND_MASK_BASE64);

/** Lit le masque terre/océan (résolution 0.5°, voir data/landMask.ts) pour un point donné. */
function isLand(latitude: number, longitude: number): boolean {
  const lat = Math.max(-90, Math.min(90 - 1e-9, latitude));
  const lon = ((longitude + 180) % 360 + 360) % 360 - 180;
  const latIdx = Math.floor((lat + 90) / LAND_MASK_RESOLUTION_DEG);
  const lonIdx = Math.floor((lon + 180) / LAND_MASK_RESOLUTION_DEG);
  const bitIndex = latIdx * LAND_MASK_LON_CELLS + lonIdx;
  const byte = landMaskBytes[bitIndex >> 3];
  return ((byte >> (bitIndex % 8)) & 1) === 1;
}

// Au-delà de ce seuil de densité (voir offlineTraffic.ts, 0-100), on considère le lieu comme
// suffisamment urbanisé pour afficher le biome "ville" plutôt que "nature".
const VILLE_TRAFFIC_THRESHOLD = 25;

/** Détermine le biome (décor de fond) à afficher pour un lieu donné. */
export function getBiome(latitude: number, longitude: number): Biome {
  if (!isLand(latitude, longitude)) return 'ocean';

  const traffic = estimateTrafficIntensity(latitude, longitude);
  return traffic >= VILLE_TRAFFIC_THRESHOLD ? 'ville' : 'nature';
}
