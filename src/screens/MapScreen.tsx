import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { STATIONS, AQI_LEVELS } from '../data/mockData';
import { Station, AQILevel } from '../types';
import PollutantCard from '../components/PollutantCard';
import AQIGauge from '../components/AQIGauge';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../theme';

const FILTER_OPTIONS: { key: AQILevel | 'all'; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'bon', label: 'Bon' },
  { key: 'moyen', label: 'Moyen' },
  { key: 'degrade', label: 'Dégradé' },
  { key: 'mauvais', label: 'Mauvais' },
];

export default function MapScreen() {
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [filter, setFilter] = useState<AQILevel | 'all'>('all');

  const filteredStations = STATIONS.filter(
    (s) => filter === 'all' || s.aqiLevel === filter
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: Colors.primary }]}>
        <Text style={styles.headerTitle}>Carte des Stations</Text>
        <Text style={styles.headerSub}>{STATIONS.length} stations de surveillance</Text>
      </View>

      {/* Carte simulée (placeholder) */}
      <View style={styles.mapPlaceholder}>
        <View style={styles.mapGrid}>
          {filteredStations.map((station) => {
            const info = AQI_LEVELS[station.aqiLevel];
            const isSelected = selectedStation?.id === station.id;
            // Positions simulées sur une grille (en px, hauteur carte = 220, largeur ≈ 400)
            const MAP_H = 220;
            const MAP_W = 400;
            const positions: Record<string, { top: number; left: number }> = {
              '1': { top: MAP_H * 0.25, left: MAP_W * 0.55 },
              '2': { top: MAP_H * 0.45, left: MAP_W * 0.52 },
              '3': { top: MAP_H * 0.70, left: MAP_W * 0.56 },
              '4': { top: MAP_H * 0.55, left: MAP_W * 0.15 },
              '5': { top: MAP_H * 0.15, left: MAP_W * 0.52 },
            };
            const pos = positions[station.id] ?? { top: MAP_H * 0.5, left: MAP_W * 0.5 };

            return (
              <TouchableOpacity
                key={station.id}
                style={[
                  styles.mapPin,
                  {
                    top: pos.top,
                    left: pos.left,
                    backgroundColor: info.color,
                    transform: [{ scale: isSelected ? 1.3 : 1 }],
                    borderWidth: isSelected ? 3 : 1.5,
                    borderColor: isSelected ? '#fff' : info.color + 'AA',
                  },
                ]}
                onPress={() => setSelectedStation(isSelected ? null : station)}
              >
                <Text style={styles.mapPinText}>{station.aqi}</Text>
                <Text style={styles.mapPinCity}>{station.city.slice(0, 3)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Légende AQI */}
        <View style={styles.mapLegend}>
          {Object.values(AQI_LEVELS).map((l) => (
            <View key={l.level} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: l.color }]} />
              <Text style={styles.legendText}>{l.label}</Text>
            </View>
          ))}
        </View>

        {/* Note */}
        <View style={styles.mapNote}>
          <Ionicons name="information-circle-outline" size={12} color={Colors.textLight} />
          <Text style={styles.mapNoteText}>Positions schématiques — intégration cartographique disponible</Text>
        </View>
      </View>

      {/* Filtres */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTER_OPTIONS.map((opt) => {
            const isActive = filter === opt.key;
            const color = opt.key === 'all' ? Colors.primary : AQI_LEVELS[opt.key as AQILevel]?.color ?? Colors.primary;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.filterChip,
                  isActive && { backgroundColor: color, borderColor: color },
                  !isActive && { borderColor: color + '60' },
                ]}
                onPress={() => setFilter(opt.key)}
              >
                <Text style={[styles.filterText, isActive ? { color: '#fff' } : { color }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Liste ou détail */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {selectedStation ? (
          <View>
            <View style={styles.detailHeader}>
              <View>
                <Text style={styles.detailName}>{selectedStation.name}</Text>
                <Text style={styles.detailCity}>{selectedStation.city}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedStation(null)}>
                <Ionicons name="close-circle" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.detailGauge}>
              <AQIGauge aqi={selectedStation.aqi} level={selectedStation.aqiLevel} size="medium" />
            </View>
            <Text style={[Typography.h4, { marginBottom: Spacing.sm }]}>Polluants</Text>
            {selectedStation.pollutants.map((p) => (
              <PollutantCard key={p.id} pollutant={p} />
            ))}
          </View>
        ) : (
          filteredStations.map((station) => {
            const info = AQI_LEVELS[station.aqiLevel];
            return (
              <TouchableOpacity
                key={station.id}
                style={styles.listItem}
                onPress={() => setSelectedStation(station)}
              >
                <View style={[styles.listDot, { backgroundColor: info.color }]} />
                <View style={styles.listItemInfo}>
                  <Text style={styles.listItemName}>{station.name}</Text>
                  <Text style={styles.listItemCity}>{station.city} · {station.type}</Text>
                </View>
                <View style={[styles.listAqi, { backgroundColor: info.color + '20' }]}>
                  <Text style={[styles.listAqiText, { color: info.color }]}>{station.aqi}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'web' ? Spacing.md : Spacing.sm,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  mapPlaceholder: {
    height: 220,
    backgroundColor: '#D6E4F0',
    position: 'relative',
    overflow: 'hidden',
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
  },
  mapPin: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -26,
    marginTop: -26,
    ...Shadows.md,
  },
  mapPinText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  mapPinCity: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 9,
    fontWeight: '600',
  },
  mapLegend: {
    position: 'absolute',
    bottom: 28,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: BorderRadius.sm,
    padding: 6,
    gap: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 9,
    color: Colors.text,
    fontWeight: '500',
  },
  mapNote: {
    position: 'absolute',
    bottom: 6,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  mapNoteText: {
    fontSize: 9,
    color: Colors.textLight,
  },
  filterRow: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterScroll: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  filterChip: {
    borderWidth: 1.5,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.md,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  listDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  listItemInfo: {
    flex: 1,
  },
  listItemName: {
    ...Typography.body,
    fontWeight: '600',
  },
  listItemCity: {
    ...Typography.bodySmall,
    textTransform: 'capitalize',
  },
  listAqi: {
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  listAqiText: {
    fontSize: 16,
    fontWeight: '800',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  detailName: {
    ...Typography.h3,
  },
  detailCity: {
    ...Typography.bodySmall,
    marginTop: 2,
  },
  detailGauge: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
});
