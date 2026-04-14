import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Pollutant } from '../types';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../theme';

interface PollutantCardProps {
  pollutant: Pollutant;
}

export default function PollutantCard({ pollutant }: PollutantCardProps) {
  const ratio = Math.min(pollutant.value / pollutant.threshold, 1);
  const isExceeded = pollutant.value > pollutant.threshold;

  const barColor = isExceeded
    ? Colors.aqi.mauvais
    : ratio > 0.7
    ? Colors.aqi.degrade
    : ratio > 0.4
    ? Colors.aqi.moyen
    : Colors.aqi.bon;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.shortName}>{pollutant.shortName}</Text>
          <Text style={styles.name}>{pollutant.name}</Text>
        </View>
        <View style={[styles.valueContainer, { borderColor: barColor }]}>
          <Text style={[styles.value, { color: barColor }]}>{pollutant.value}</Text>
          <Text style={styles.unit}>{pollutant.unit}</Text>
        </View>
      </View>

      <View style={[styles.barBackground, { flexDirection: 'row' }]}>
        <View style={[styles.barFill, { flex: ratio, backgroundColor: barColor }]} />
        <View style={{ flex: 1 - ratio }} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Seuil : {pollutant.threshold} {pollutant.unit}
        </Text>
        {isExceeded && (
          <Text style={[styles.footerBadge, { color: Colors.aqi.mauvais }]}>
            Dépassement
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  shortName: {
    ...Typography.h4,
    fontSize: 15,
  },
  name: {
    ...Typography.bodySmall,
    marginTop: 2,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    borderWidth: 1.5,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 3,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
  },
  unit: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  barBackground: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  barFill: {
    height: 6,
    borderRadius: BorderRadius.full,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    ...Typography.bodySmall,
  },
  footerBadge: {
    fontSize: 11,
    fontWeight: '700',
  },
});
