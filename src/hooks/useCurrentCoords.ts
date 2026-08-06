import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

export interface Coords {
  latitude: number;
  longitude: number;
}

/** Demande la permission de localisation puis récupère la position actuelle une seule fois. */
export function useCurrentCoords() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelled) setError('Position indisponible');
          return;
        }

        const position = await Location.getCurrentPositionAsync({});
        if (!cancelled) {
          setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        }
      } catch {
        if (!cancelled) setError('Position indisponible');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { coords, error };
}
