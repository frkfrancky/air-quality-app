import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { CityLayers } from './CityScene';
import { Colors, Spacing, BorderRadius, Shadows } from '../theme';

interface CityLayersPanelProps {
  value: CityLayers;
  onChange: (next: CityLayers) => void;
}

const ITEMS: { key: keyof CityLayers; label: string }[] = [
  { key: 'aqi', label: "Indice de la qualité de l'air" },
  { key: 'pm25', label: 'Particule fine PM2.5' },
  { key: 'pm10', label: 'Particule fine PM10' },
  { key: 'traffic', label: 'Pollution automobile' },
  { key: 'ozone', label: 'Ozone' },
  { key: 'weather', label: 'Condition météo' },
];

export default function CityLayersPanel({ value, onChange }: CityLayersPanelProps) {
  const toggle = (key: keyof CityLayers) => {
    onChange({ ...value, [key]: !value[key] });
  };

  return (
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
  );
}

const styles = StyleSheet.create({
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
});
