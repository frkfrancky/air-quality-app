import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCurrentCoords, Coords } from '../hooks/useCurrentCoords';
import { fetchAirQuality, OpenMeteoAirQuality } from '../services/openMeteo';
import { fetchTrafficIntensity as fetchTomTomTraffic, hasTomTomApiKey } from '../services/tomtom';
import { estimateTrafficIntensity } from '../services/offlineTraffic';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../theme';

// Variante web : Leaflet monté directement dans le DOM. Sur react-native-web, une <View> se rend
// en <div> et transmet sa ref vers ce nœud DOM réel, donc pas besoin de JSX HTML brut.

interface CityMapProps {
  /** Affiche un bouton de fermeture (utile quand ce composant est présenté en superposition). */
  onClose?: () => void;
  /** Appelé à chaque fois que l'utilisateur clique sur un point de la carte. */
  onSelectLocation?: (coords: Coords) => void;
}

// Centre de secours (France) si la géolocalisation échoue ou est refusée — la carte reste
// utilisable, l'utilisateur peut cliquer n'importe où pour choisir un point.
const FALLBACK_CENTER: Coords = { latitude: 46.6, longitude: 2.4 };

// Pastille bleue (icône dessinée en CSS, pas d'image à charger) pour la position GPS réelle — fixe.
const MY_LOCATION_ICON = L.divIcon({
  className: '',
  html: '<div style="width:14px;height:14px;border-radius:50%;background:#1565C0;border:3px solid #fff;box-shadow:0 0 0 4px rgba(21,101,192,0.35);"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

// Épingle rouge pour le point choisi en cliquant — se déplace à chaque clic.
const PIN_ICON = L.divIcon({
  className: '',
  html: '<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;background:#E53935;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.35);transform:rotate(-45deg);"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

function formatPopup(aq: OpenMeteoAirQuality | null, traffic: number | null) {
  const lines: string[] = [];
  if (aq) {
    lines.push(`<strong>IQA ${Math.round(aq.aqi)}</strong>`);
    lines.push(`PM2.5 : ${Math.round(aq.pm25)} µg/m³`);
    lines.push(`PM10 : ${Math.round(aq.pm10)} µg/m³`);
    lines.push(`Ozone : ${Math.round(aq.ozone)} µg/m³`);
  } else {
    lines.push("Qualité de l'air indisponible");
  }
  // Densité de véhicules affichée ici pour vérifier visuellement qu'elle change bien d'un lieu à
  // l'autre (voir aussi le nombre de voitures dans la scène).
  lines.push(traffic !== null ? `Trafic : ${traffic}/100` : 'Trafic indisponible');
  return lines.join('<br/>');
}

export default function CityMap({ onClose, onSelectLocation }: CityMapProps) {
  const containerRef = useRef<View>(null);
  const mapRef = useRef<L.Map | null>(null);
  const pinMarkerRef = useRef<L.Marker | null>(null);
  const { coords: gpsCoords, error } = useCurrentCoords();
  const [selected, setSelected] = useState<Coords | null>(null);

  const showValuesAt = useCallback(async (coords: Coords) => {
    const marker = pinMarkerRef.current;
    if (!marker) return;
    marker.setLatLng([coords.latitude, coords.longitude]);
    marker.bindPopup('Chargement…').openPopup();

    // La qualité de l'air reste une requête réseau ; le trafic est calculé hors ligne (sauf si une
    // clé TomTom est configurée), donc instantané et jamais en échec.
    let aq: OpenMeteoAirQuality | null = null;

    try {
      aq = await fetchAirQuality(coords.latitude, coords.longitude);
    } catch {
      // Qualité de l'air indisponible pour ce point.
    }

    let traffic: number | null = null;
    if (hasTomTomApiKey()) {
      try {
        traffic = await fetchTomTomTraffic(coords.latitude, coords.longitude);
      } catch {
        // Requête TomTom échouée pour ce point.
      }
    } else {
      traffic = estimateTrafficIntensity(coords.latitude, coords.longitude);
    }

    marker.setPopupContent(formatPopup(aq, traffic));
  }, []);

  // La carte s'initialise une seule fois, dès qu'on a un point de départ (position réelle si
  // disponible, sinon un centre de secours pour que le clic reste utilisable sans permission).
  useEffect(() => {
    const node = containerRef.current as unknown as HTMLElement | null;
    if (!node || mapRef.current || (!gpsCoords && !error)) return;

    const start = gpsCoords ?? FALLBACK_CENTER;
    const map = L.map(node).setView([start.latitude, start.longitude], gpsCoords ? 12 : 5);

    // Fond de carte minimaliste (CartoDB Positron sans labels, basé sur les données OpenStreetMap).
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20,
    }).addTo(map);

    // Position GPS réelle : marqueur fixe, ne bouge jamais.
    if (gpsCoords) {
      L.marker([gpsCoords.latitude, gpsCoords.longitude], { icon: MY_LOCATION_ICON })
        .addTo(map)
        .bindPopup('Ma position');
    }

    // Point choisi en cliquant : épingle qui se déplace à chaque clic.
    pinMarkerRef.current = L.marker([start.latitude, start.longitude], { icon: PIN_ICON }).addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      // `.wrap()` ramène la longitude dans [-180, 180] : sans ça, un clic après avoir fait défiler
      // la carte plusieurs fois autour du globe renvoie une longitude hors plage (ex. 190° au lieu
      // de -170°), qu'Open-Meteo ne sait pas résoudre — d'où l'absence de valeurs dans certaines zones.
      const wrapped = e.latlng.wrap();
      const next: Coords = { latitude: wrapped.lat, longitude: wrapped.lng };
      setSelected(next);
      onSelectLocation?.(next);
      showValuesAt(next);
    });

    if (gpsCoords) {
      setSelected(gpsCoords);
      onSelectLocation?.(gpsCoords);
      showValuesAt(gpsCoords);
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      pinMarkerRef.current = null;
    };
  }, [gpsCoords, error, onSelectLocation, showValuesAt]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Choisir un lieu</Text>
          <Text style={styles.subtitle}>
            {selected
              ? `${selected.latitude.toFixed(3)}, ${selected.longitude.toFixed(3)}`
              : error ?? 'Cliquez sur la carte pour choisir un point'}
          </Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={8}>
            <Ionicons name="close" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <View ref={containerRef} style={styles.mapArea} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.h4,
  },
  subtitle: {
    ...Typography.bodySmall,
  },
  closeButton: {
    padding: 4,
  },
  mapArea: {
    flex: 1,
    minHeight: 200,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
