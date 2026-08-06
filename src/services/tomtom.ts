// TomTom Traffic API (Flow Segment Data) : nécessite une clé API gratuite (contrairement à
// Open-Meteo). https://developer.tomtom.com/traffic-api/documentation/tomtom-maps/traffic-flow/flow-segment-data
//
// Pour l'activer :
//   1. Créez un compte gratuit sur https://developer.tomtom.com et récupérez une clé API.
//   2. Créez un fichier `.env.local` à la racine du projet (déjà ignoré par git) contenant :
//        EXPO_PUBLIC_TOMTOM_API_KEY=votre_cle
//   3. Redémarrez le serveur (les variables EXPO_PUBLIC_* ne sont lues qu'au démarrage).
// Sans clé, le trafic garde sa valeur par défaut/manuelle dans le panneau d'intensité.

const API_KEY = process.env.EXPO_PUBLIC_TOMTOM_API_KEY;

export function hasTomTomApiKey() {
  return Boolean(API_KEY);
}

/** Renvoie un niveau de congestion 0 (circulation fluide) à 100 (quasi à l'arrêt). */
export async function fetchTrafficIntensity(latitude: number, longitude: number): Promise<number> {
  if (!API_KEY) {
    throw new Error('Clé TomTom manquante (EXPO_PUBLIC_TOMTOM_API_KEY)');
  }

  const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${latitude},${longitude}&key=${API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Échec de la requête trafic');
  }

  const data = await response.json();
  const { currentSpeed, freeFlowSpeed } = data.flowSegmentData ?? {};
  if (!freeFlowSpeed) return 0;

  const congestion = 1 - currentSpeed / freeFlowSpeed;
  return Math.round(Math.min(100, Math.max(0, congestion * 100)));
}
