import { cities, distanceKm } from './cityDataset';

// Recherche de la ville la plus proche entièrement hors ligne : le nom d'une ville ne change
// jamais, ça ne justifie donc pas un appel réseau à chaque fois (contrairement à l'IQA, la météo
// ou le trafic). Aucune requête, aucune limite de débit, fonctionne hors ligne.

/** Renvoie le nom de la ville (>15 000 habitants) la plus proche des coordonnées données. */
export function findNearestCityName(latitude: number, longitude: number): string {
  let nearestName = 'Ville inconnue';
  let nearestDistance = Infinity;

  for (const [cityLat, cityLon, name] of cities) {
    const distance = distanceKm(latitude, longitude, cityLat, cityLon);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestName = name;
    }
  }

  return nearestName;
}
