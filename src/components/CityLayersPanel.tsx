import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CityLayers } from './CityScene';
import CityMap from './CityMap';
import { Coords } from '../hooks/useCurrentCoords';
import { Colors, Spacing, BorderRadius, Shadows } from '../theme';

interface CityLayersPanelProps {
  value: CityLayers;
  onChange: (next: CityLayers) => void;
  /** Appelé quand l'utilisateur choisit un lieu sur la carte (pour rendre CityScene dynamique). */
  onSelectLocation?: (coords: Coords) => void;
}

const ITEMS: { key: keyof CityLayers; label: string }[] = [
  { key: 'aqi', label: "Indice de la qualité de l'air" },
  { key: 'pm25', label: 'Particule fine PM2.5' },
  { key: 'pm10', label: 'Particule fine PM10' },
  { key: 'traffic', label: 'Pollution automobile' },
  { key: 'ozone', label: 'Ozone' },
  { key: 'weather', label: 'Condition météo' },
];

export default function CityLayersPanel({ value, onChange, onSelectLocation }: CityLayersPanelProps) {
  const [showMap, setShowMap] = useState(false);

  const toggle = (key: keyof CityLayers) => {
    onChange({ ...value, [key]: !value[key] });
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.grid}>
        {ITEMS.map((item) => (
          <View key={item.key} style={styles.card}>
            <Text style={styles.label}>{item.label}</Text>
            <Switch
              value={value[item.key]}
              onValueChange={() => toggle(item.key)}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor="#fff"
            />
          </View>
        ))}
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
    minWidth: 110,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
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
