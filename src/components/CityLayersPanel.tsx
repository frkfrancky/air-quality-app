import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CityLayers, CityIntensity, WeatherCondition } from './CityScene';
import CityMap from './CityMap';
import { Coords } from '../hooks/useCurrentCoords';
import { getAQILevel } from '../data/mockData';
import { Colors, Spacing, BorderRadius, Shadows } from '../theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface CityLayersPanelProps {
  value: CityLayers;
  onChange: (next: CityLayers) => void;
  /** Valeurs actuelles de chaque paramètre, affichées en chiffres sur chaque carte. */
  intensity: CityIntensity;
  /** Appelé quand l'utilisateur choisit un lieu sur la carte (pour rendre CityScene dynamique). */
  onSelectLocation?: (coords: Coords) => void;
}

const WEATHER_LABELS: Record<WeatherCondition, { label: string; icon: IoniconName }> = {
  sunny: { label: 'Ensoleillé', icon: 'sunny' },
  cloudy: { label: 'Nuageux', icon: 'cloud' },
  rainy: { label: 'Pluvieux', icon: 'rainy' },
  snowy: { label: 'Neigeux', icon: 'snow' },
};

interface Item {
  key: keyof CityLayers;
  label: string;
  icon: IoniconName;
  color: (intensity: CityIntensity) => string;
  /** Valeur affichée en grand sur la carte. */
  valueText: (intensity: CityIntensity) => string;
  /** Remplissage de la jauge (0 à 1) ; `null` pour les paramètres sans échelle numérique (météo). */
  gauge: (intensity: CityIntensity) => number | null;
}

const ITEMS: Item[] = [
  {
    key: 'aqi',
    label: "Indice de la qualité de l'air",
    icon: 'analytics',
    color: (i) => Colors.aqi[getAQILevel(i.aqi)],
    valueText: (i) => `${Math.round(i.aqi)}`,
    gauge: (i) => Math.min(1, i.aqi / 400),
  },
  {
    key: 'pm25',
    label: 'Particule fine PM2.5',
    icon: 'cloud',
    color: () => '#5C6BC0',
    valueText: (i) => `${Math.round(i.pm25)} µg/m³`,
    gauge: (i) => Math.min(1, i.pm25 / 150),
  },
  {
    key: 'pm10',
    label: 'Particule fine PM10',
    icon: 'cloud-outline',
    color: () => '#8D6E63',
    valueText: (i) => `${Math.round(i.pm10)} µg/m³`,
    gauge: (i) => Math.min(1, i.pm10 / 200),
  },
  {
    key: 'traffic',
    label: 'Pollution automobile',
    icon: 'car',
    color: () => '#E53935',
    valueText: (i) => `${Math.round(i.traffic)}/100`,
    gauge: (i) => Math.min(1, i.traffic / 100),
  },
  {
    key: 'ozone',
    label: 'Ozone',
    icon: 'sunny',
    color: () => '#F57F17',
    valueText: (i) => `${Math.round(i.ozone)} µg/m³`,
    gauge: (i) => Math.min(1, i.ozone / 240),
  },
  {
    key: 'weather',
    label: 'Condition météo',
    icon: 'partly-sunny',
    color: () => '#1E88E5',
    valueText: (i) => WEATHER_LABELS[i.weather].label,
    gauge: () => null,
  },
];

export default function CityLayersPanel({ value, onChange, intensity, onSelectLocation }: CityLayersPanelProps) {
  const [showMap, setShowMap] = useState(false);

  const toggle = (key: keyof CityLayers) => {
    onChange({ ...value, [key]: !value[key] });
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.grid}>
        {ITEMS.map((item) => {
          const color = item.color(intensity);
          const gauge = item.gauge(intensity);
          const icon = item.key === 'weather' ? WEATHER_LABELS[intensity.weather].icon : item.icon;
          const active = value[item.key];

          return (
            <View key={item.key} style={[styles.card, !active && styles.cardInactive]}>
              <View style={styles.cardTop}>
                <View style={[styles.iconBadge, { backgroundColor: color + '1E' }]}>
                  <Ionicons name={icon} size={15} color={color} />
                </View>
                <Text style={styles.label} numberOfLines={2}>{item.label}</Text>
              </View>

              <Text style={[styles.valueText, { color }]} numberOfLines={1} adjustsFontSizeToFit>
                {item.valueText(intensity)}
              </Text>

              {gauge !== null && (
                <View style={styles.gaugeTrack}>
                  <View style={[styles.gaugeFill, { width: `${gauge * 100}%`, backgroundColor: color }]} />
                </View>
              )}

              <View style={styles.cardBottom}>
                <Switch
                  value={active}
                  onValueChange={() => toggle(item.key)}
                  trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                  thumbColor="#fff"
                  style={styles.switch}
                />
              </View>
            </View>
          );
        })}
      </View>

      <TouchableOpacity style={styles.mapButton} onPress={() => setShowMap(true)}>
        <Ionicons name="map-outline" size={16} color="#fff" />
        <Text style={styles.mapButtonText}>Afficher la carte</Text>
      </TouchableOpacity>

      {showMap && (
        <View style={styles.mapOverlay}>
          <CityMap onClose={() => setShowMap(false)} onSelectLocation={onSelectLocation} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  card: {
    flexBasis: '30%',
    flexGrow: 1,
    minWidth: 130,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    ...Shadows.sm,
  },
  cardInactive: {
    opacity: 0.55,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xs,
  },
  iconBadge: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.textSecondary,
    lineHeight: 14,
  },
  valueText: {
    fontSize: 19,
    fontWeight: '800',
  },
  gaugeTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.background,
    overflow: 'hidden',
    marginTop: Spacing.xs,
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 2,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.xs,
  },
  switch: {
    transform: [{ scale: 0.8 }],
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  mapButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
});
