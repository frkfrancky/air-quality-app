import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AQILevel } from '../types';
import { AQI_LEVELS } from '../data/mockData';
import { Colors, Typography, BorderRadius } from '../theme';

interface AQIGaugeProps {
  aqi: number;
  level: AQILevel;
  size?: 'small' | 'medium' | 'large';
}

export default function AQIGauge({ aqi, level, size = 'medium' }: AQIGaugeProps) {
  const info = AQI_LEVELS[level];
  const color = info.color;

  const dimensions = {
    small: { circle: 64, fontSize: 18, labelSize: 10 },
    medium: { circle: 96, fontSize: 26, labelSize: 12 },
    large: { circle: 140, fontSize: 38, labelSize: 14 },
  }[size];

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.circle,
          {
            width: dimensions.circle,
            height: dimensions.circle,
            borderRadius: dimensions.circle / 2,
            borderColor: color,
            backgroundColor: color + '18',
          },
        ]}
      >
        <Text style={[styles.aqiNumber, { fontSize: dimensions.fontSize, color }]}>{aqi}</Text>
        <Text style={[styles.aqiUnit, { fontSize: dimensions.labelSize, color }]}>IQA</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: color }]}>
        <Text style={styles.badgeText}>{info.label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 8,
  },
  circle: {
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aqiNumber: {
    fontWeight: '800',
    lineHeight: undefined,
  },
  aqiUnit: {
    fontWeight: '600',
    marginTop: -2,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
