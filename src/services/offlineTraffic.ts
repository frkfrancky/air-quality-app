import { cities, distanceKm } from './cityDataset';

// Alternative à TomTom/Overpass (voir services/tomtom.ts) : pas de congestion en temps réel, mais
// une estimation hors ligne de la "pression de circulation" d'un lieu, à partir des données de
// population déjà embarquées (services/cityDataset.ts). Overpass s'est avéré trop peu fiable en
// usage réel (surcharges fréquentes, blocages anti-abus) — cette version ne fait aucun appel
// réseau, donc ne peut jamais échouer ni être limitée en débit.
//
// Modèle gravitaire classique en géographie urbaine : chaque ville dans un rayon de recherche
// contribue à un score selon sa population divisée par le carré de sa distance — plus on est
// proche d'une grande ville, plus le score est élevé.
const SEARCH_RADIUS_KM = 50;
const MIN_DISTANCE_KM = 1; // évite une valeur extrême pile au centre d'une ville (distance ~ 0)
// Score au-delà duquel l'estimation est considérée "saturée" à 100 — calibré empiriquement à
// partir de villes réelles (une préfecture moyenne isolée atteint ~75, une grande agglomération
// ou banlieue dense sature à 100).
const SATURATION_SCORE = 60000;

/** Renvoie une estimation 0 (zone isolée) à 100 (ville ou agglomération dense), pas une congestion réelle. */
export function estimateTrafficIntensity(latitude: number, longitude: number): number {
  let score = 0;

  for (const [cityLat, cityLon, , population] of cities) {
    const distance = distanceKm(latitude, longitude, cityLat, cityLon);
    if (distance > SEARCH_RADIUS_KM) continue;
    score += population / Math.max(distance, MIN_DISTANCE_KM) ** 2;
  }

  return Math.round(Math.min(100, (score / SATURATION_SCORE) * 100));
}
