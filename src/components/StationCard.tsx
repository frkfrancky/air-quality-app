import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Station } from '../types';
import { AQI_LEVELS } from '../data/mockData';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../theme';

interface StationCardProps {
  station: Station;
  onPress?: () => void;
  compact?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  urbaine: 'Urbaine',
  periurbaine: 'Péri-urbaine',
  rurale: 'Rurale',
  trafic: 'Trafic',
  industrielle: 'Industrielle',
};

export default function StationCard({ station, onPress, compact = false }: StationCardProps) {
  const info = AQI_LEVELS[station.aqiLevel];
  const typeColor = Colors.station[station.type] ?? Colors.primary;

  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.cardCompact]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.aqiStrip, { backgroundColor: info.color }]} />
      <View style={styles.content}>
        <View style={styles.row}>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>{station.name}</Text>
            <View style={styles.tags}>
              <View style={[styles.tag, { backgroundColor: typeColor + '20', borderColor: typeColor }]}>
                <Text style={[styles.tagText, { color: typeColor }]}>{TYPE_LABELS[station.type]}</Text>
              </View>
              <Text style={styles.city}>{station.city}</Text>
            </View>
          </View>
          <View style={[styles.aqiBox, { borderColor: info.color, backgroundColor: info.color + '15' }]}>
            <Text style={[styles.aqiValue, { color: info.color }]}>{station.aqi}</Text>
            <Text style={[styles.aqiLabel, { color: info.color }]}>{info.label}</Text>
          </View>
        </View>

        {!compact && (
          <View style={styles.pollutantsRow}>
            {station.pollutants.slice(0, 4).map((p) => (
              <View key={p.id} style={styles.pollutantChip}>
                <Text style={styles.pollutantName}>{p.shortName}</Text>
                <Text style={styles.pollutantValue}>{p.value}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.updated}>
          Mis à jour : {new Date(station.lastUpdated).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    overflow: 'hidden',
    ...Shadows.sm,
  },
  cardCompact: {
    marginBottom: Spacing.xs,
  },
  aqiStrip: {
    width: 5,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  info: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  name: {
    ...Typography.h4,
    marginBottom: 4,
  },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  tag: {
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  city: {
    ...Typography.bodySmall,
    fontWeight: '500',
  },
  aqiBox: {
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 60,
  },
  aqiValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  aqiLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  pollutantsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
    flexWrap: 'wrap',
  },
  pollutantChip: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  pollutantName: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  pollutantValue: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '700',
  },
  updated: {
    ...Typography.bodySmall,
    fontSize: 10,
    marginTop: 2,
  },
});
