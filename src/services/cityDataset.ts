import citiesData from '../data/cities.json';

// [latitude, longitude, nom, population] — des tuples plutôt que des objets, pour réduire la
// taille du fichier embarqué. Source : GeoNames "cities15000" (licence CC BY 4.0,
// https://www.geonames.org/), villes de plus de 15 000 habitants dans le monde (~34 000 entrées,
// ~1,2 Mo). Partagé entre offlineGeocoding.ts (nom de ville) et offlineTraffic.ts (estimation de
// densité de circulation) : aucune des deux ne nécessite un appel réseau.
export type CityTuple = [latitude: number, longitude: number, name: string, population: number];
export const cities = citiesData as CityTuple[];

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
