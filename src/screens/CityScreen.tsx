import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import CityScene, {
  getSkyColors,
  DEFAULT_CITY_LAYERS,
  DEFAULT_CITY_INTENSITY,
  CityLayers,
  CityIntensity,
} from '../components/CityScene';
import CityLayersPanel from '../components/CityLayersPanel';
import { Colors, Spacing } from '../theme';
import CityIntensityPanel from '../components/CityIntensityPanel';
import { useCurrentCoords, Coords } from '../hooks/useCurrentCoords';
import { fetchAirQuality, fetchWeatherCondition } from '../services/openMeteo';
import { fetchTrafficIntensity as fetchTomTomTraffic, hasTomTomApiKey } from '../services/tomtom';
import { estimateTrafficIntensity } from '../services/offlineTraffic';

const DESKTOP_BREAKPOINT = 768;

export default function CityScreen() {
  const [layers, setLayers] = useState<CityLayers>(DEFAULT_CITY_LAYERS);
  const [intensity, setIntensity] = useState<CityIntensity>(DEFAULT_CITY_INTENSITY);
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;
  const skyTop = getSkyColors(new Date()).top;

  // Lieu choisi en cliquant sur la carte (dans CityLayersPanel) ; tant qu'aucun lieu n'a été
  // choisi, on utilise la position réelle de l'appareil.
  const { coords: gpsCoords } = useCurrentCoords();
  const [selectedCoords, setSelectedCoords] = useState<Coords | null>(null);
  const effectiveCoords = selectedCoords ?? gpsCoords;
  const [timezoneOffsetMinutes, setTimezoneOffsetMinutes] = useState<number | undefined>(undefined);

  // Dès que le lieu effectif est connu (position réelle ou point choisi sur la carte), on va
  // chercher la qualité de l'air et la météo réelles (Open-Meteo, gratuit, sans clé) pour ce
  // point, ainsi que son décalage horaire (pour que CityScene affiche l'heure locale du lieu).
  useEffect(() => {
    if (!effectiveCoords) return;
    let cancelled = false;

    (async () => {
      try {
        const [airQuality, weather] = await Promise.all([
          fetchAirQuality(effectiveCoords.latitude, effectiveCoords.longitude),
          fetchWeatherCondition(effectiveCoords.latitude, effectiveCoords.longitude),
        ]);
        if (!cancelled) {
          setIntensity((prev) => ({
            ...prev,
            aqi: airQuality.aqi,
            pm25: airQuality.pm25,
            pm10: airQuality.pm10,
            ozone: airQuality.ozone,
            weather: weather.condition,
          }));
          setTimezoneOffsetMinutes(weather.utcOffsetMinutes);
        }
      } catch {
        // Échec réseau : on garde les valeurs par défaut/manuelles de l'intensité.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [effectiveCoords]);

  // Trafic : TomTom (temps réel) si une clé est configurée (voir services/tomtom.ts), sinon
  // estimation hors ligne basée sur la population des villes proches (services/offlineTraffic.ts).
  // Overpass s'est avéré trop peu fiable en usage réel (surcharges, blocages anti-abus) pour rester
  // la solution de repli. Effet séparé de celui ci-dessus pour qu'un échec TomTom ne bloque pas la
  // mise à jour de la qualité de l'air/météo.
  useEffect(() => {
    if (!effectiveCoords) return;

    if (!hasTomTomApiKey()) {
      const traffic = estimateTrafficIntensity(effectiveCoords.latitude, effectiveCoords.longitude);
      setIntensity((prev) => ({ ...prev, traffic }));
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const traffic = await fetchTomTomTraffic(effectiveCoords.latitude, effectiveCoords.longitude);
        if (!cancelled) {
          setIntensity((prev) => ({ ...prev, traffic }));
        }
      } catch {
        // Requête échouée : le trafic garde sa valeur par défaut/manuelle.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [effectiveCoords]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: skyTop }]} edges={['top']}>
      <StatusBar style="light" />

      <View style={[styles.content, isDesktop && styles.contentRow]}>
        <View style={[styles.sceneSection, isDesktop && styles.sceneSectionRow]}>
          <CityScene
            layers={layers}
            intensity={intensity}
            locationOverride={selectedCoords ?? undefined}
            locationTimezoneOffsetMinutes={timezoneOffsetMinutes}
          />
        </View>

        <View style={[styles.controlsSection, isDesktop && styles.controlsSectionRow]}>
          <ScrollView style={styles.controlsScroll} contentContainerStyle={styles.controlsScrollContent}>
            <CityLayersPanel value={layers} onChange={setLayers} onSelectLocation={setSelectedCoords} />
            {/* <CityIntensityPanel value={intensity} onChange={setIntensity} /> */}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    flexDirection: 'column',
  },
  contentRow: {
    flexDirection: 'row',
  },
  sceneSection: {
    flex: 1.4,
  },
  sceneSectionRow: {
    flex: 1.6,
  },
  // Toujours blanc, quelle que soit la couleur du ciel (dynamique selon l'heure) affichée derrière.
  controlsSection: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  controlsSectionRow: {
    backgroundColor: Colors.surface,
  },
  controlsScroll: {
    flex: 1,
  },
  controlsScrollContent: {
    flexGrow: 1,
    padding: Spacing.md,
  },
});
