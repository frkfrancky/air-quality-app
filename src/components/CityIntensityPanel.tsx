import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { CityIntensity, WeatherCondition } from './CityScene';
import { Colors, Spacing, BorderRadius, Shadows } from '../theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface CityIntensityPanelProps {
  value: CityIntensity;
  onChange: (next: CityIntensity) => void;
}

interface SliderField {
  key: 'aqi' | 'pm25' | 'pm10' | 'traffic' | 'ozone';
  label: string;
  min: number;
  max: number;
  unit: string;
}

const SLIDER_FIELDS: SliderField[] = [
  { key: 'aqi', label: "Indice de la qualité de l'air", min: 0, max: 400, unit: '' },
  { key: 'pm25', label: 'Particule fine PM2.5', min: 0, max: 150, unit: ' µg/m³' },
  { key: 'pm10', label: 'Particule fine PM10', min: 0, max: 200, unit: ' µg/m³' },
  { key: 'traffic', label: 'Pollution automobile', min: 0, max: 100, unit: ' %' },
  { key: 'ozone', label: 'Ozone', min: 0, max: 240, unit: ' µg/m³' },
];

const WEATHER_OPTIONS: { key: WeatherCondition; label: string; icon: IoniconName }[] = [
  { key: 'sunny', label: 'Ensoleillé', icon: 'sunny' },
  { key: 'cloudy', label: 'Nuageux', icon: 'cloud' },
  { key: 'rainy', label: 'Pluvieux', icon: 'rainy' },
  { key: 'snowy', label: 'Neigeux', icon: 'snow' },
];

export default function CityIntensityPanel({ value, onChange }: CityIntensityPanelProps) {
  const setNumber = (key: SliderField['key'], v: number) => {
    onChange({ ...value, [key]: v });
  };

  const setWeather = (weather: WeatherCondition) => {
    onChange({ ...value, weather });
  };

  const activeWeather = WEATHER_OPTIONS.find((o) => o.key === value.weather);

  return (
    <View style={styles.grid}>
      {SLIDER_FIELDS.map((field) => (
        <View key={field.key} style={styles.card}>
          <Text style={styles.label}>{field.label}</Text>
          <Slider
            style={styles.slider}
            minimumValue={field.min}
            maximumValue={field.max}
            step={1}
            value={value[field.key]}
            onValueChange={(v) => setNumber(field.key, v)}
            minimumTrackTintColor={Colors.primary}
            maximumTrackTintColor={Colors.border}
            thumbTintColor={Colors.primary}
          />
          <Text style={styles.valueText}>
            {Math.round(value[field.key])}
            {field.unit}
          </Text>
        </View>
      ))}

      <View style={styles.card}>
        <Text style={styles.label}>Condition météo</Text>
        <View style={styles.weatherRow}>
          {WEATHER_OPTIONS.map((opt) => {
            const active = value.weather === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.weatherOption, active && styles.weatherOptionActive]}
                onPress={() => setWeather(opt.key)}
              >
                <Ionicons name={opt.icon} size={18} color={active ? '#fff' : Colors.textSecondary} />
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.valueText}>{activeWeather?.label}</Text>
      </View>
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
    minWidth: 130,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    ...Shadows.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  slider: {
    width: '100%',
    height: 32,
  },
  valueText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  weatherRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  weatherOption: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherOptionActive: {
    backgroundColor: Colors.primary,
  },
});
