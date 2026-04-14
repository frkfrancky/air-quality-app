import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { HISTORICAL_DATA, STATIONS, AQI_LEVELS } from '../data/mockData';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = Math.min(SCREEN_WIDTH - Spacing.md * 2, 600);
const CHART_HEIGHT = 160;

type PollutantKey = 'aqi' | 'pm25' | 'pm10' | 'no2' | 'o3';

const POLLUTANT_OPTIONS: { key: PollutantKey; label: string; color: string; unit: string }[] = [
  { key: 'aqi', label: 'IQA Global', color: Colors.primary, unit: '' },
  { key: 'pm25', label: 'PM2.5', color: '#E53935', unit: 'µg/m³' },
  { key: 'pm10', label: 'PM10', color: '#FB8C00', unit: 'µg/m³' },
  { key: 'no2', label: 'NO₂', color: '#8E24AA', unit: 'µg/m³' },
  { key: 'o3', label: 'O₃', color: '#00897B', unit: 'µg/m³' },
];

function SimpleBarChart({
  data,
  pollutantKey,
  color,
  unit,
}: {
  data: typeof HISTORICAL_DATA;
  pollutantKey: PollutantKey;
  color: string;
  unit: string;
}) {
  const values = data.map((d) => d[pollutantKey] as number);
  const maxVal = Math.max(...values, 1);
  const barWidth = (CHART_WIDTH - Spacing.md * 2) / data.length - 8;

  return (
    <View style={[styles.chartContainer, { width: CHART_WIDTH }]}>
      {/* Grille */}
      <View style={styles.chartArea}>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <View
            key={ratio}
            style={[styles.gridLine, { bottom: ratio * CHART_HEIGHT }]}
          />
        ))}

        {/* Barres */}
        <View style={styles.barsRow}>
          {data.map((d, i) => {
            const val = d[pollutantKey] as number;
            const barHeight = Math.max((val / maxVal) * CHART_HEIGHT, 2);
            return (
              <View key={i} style={styles.barWrapper}>
                <Text style={styles.barValue}>{val}</Text>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      width: barWidth,
                      backgroundColor: color,
                    },
                  ]}
                />
                <Text style={styles.barLabel}>{d.date}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <Text style={styles.chartUnit}>{unit}</Text>
    </View>
  );
}

export default function StatsScreen() {
  const [activePollutant, setActivePollutant] = useState<PollutantKey>('aqi');
  const [activeStation, setActiveStation] = useState(STATIONS[0].id);

  const pollutantInfo = POLLUTANT_OPTIONS.find((p) => p.key === activePollutant)!;

  const stats = HISTORICAL_DATA.reduce(
    (acc, d) => {
      const val = d[activePollutant] as number;
      acc.sum += val;
      acc.max = Math.max(acc.max, val);
      acc.min = Math.min(acc.min, val);
      acc.count++;
      return acc;
    },
    { sum: 0, max: 0, min: Infinity, count: 0 }
  );
  const avg = Math.round(stats.sum / stats.count);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.header, { backgroundColor: Colors.primary }]}>
        <Text style={styles.headerTitle}>Statistiques</Text>
        <Text style={styles.headerSub}>Évolution des 7 derniers jours</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Sélection de station */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Station</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stationScroll}>
            {STATIONS.map((s) => {
              const isActive = activeStation === s.id;
              const info = AQI_LEVELS[s.aqiLevel];
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.stationChip,
                    isActive && { backgroundColor: Colors.primary, borderColor: Colors.primary },
                    !isActive && { borderColor: Colors.border },
                  ]}
                  onPress={() => setActiveStation(s.id)}
                >
                  <View style={[styles.chipDot, { backgroundColor: info.color }]} />
                  <Text style={[styles.chipText, isActive && { color: '#fff' }]}>
                    {s.city}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Sélection polluant */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Polluant affiché</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stationScroll}>
            {POLLUTANT_OPTIONS.map((opt) => {
              const isActive = activePollutant === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.pollutantChip,
                    isActive && { backgroundColor: opt.color, borderColor: opt.color },
                    !isActive && { borderColor: opt.color + '60' },
                  ]}
                  onPress={() => setActivePollutant(opt.key)}
                >
                  <Text style={[styles.chipText, isActive ? { color: '#fff' } : { color: opt.color }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Statistiques résumées */}
        <View style={styles.statsRow}>
          {[
            { label: 'Moyenne', value: avg, icon: 'analytics' },
            { label: 'Maximum', value: stats.max, icon: 'trending-up' },
            { label: 'Minimum', value: stats.min === Infinity ? 0 : stats.min, icon: 'trending-down' },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Ionicons name={stat.icon as any} size={20} color={pollutantInfo.color} />
              <Text style={[styles.statValue, { color: pollutantInfo.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Graphique barres */}
        <View style={styles.section}>
          <View style={styles.chartTitleRow}>
            <View style={[styles.chartDot, { backgroundColor: pollutantInfo.color }]} />
            <Text style={styles.sectionTitle}>{pollutantInfo.label} — 7 jours</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <SimpleBarChart
              data={HISTORICAL_DATA}
              pollutantKey={activePollutant}
              color={pollutantInfo.color}
              unit={pollutantInfo.unit}
            />
          </ScrollView>
        </View>

        {/* Tableau des données */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tableau de données</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 1 }]}>Date</Text>
              <Text style={[styles.tableCell, styles.tableCellHeader]}>IQA</Text>
              <Text style={[styles.tableCell, styles.tableCellHeader]}>PM2.5</Text>
              <Text style={[styles.tableCell, styles.tableCellHeader]}>PM10</Text>
              <Text style={[styles.tableCell, styles.tableCellHeader]}>NO₂</Text>
              <Text style={[styles.tableCell, styles.tableCellHeader]}>O₃</Text>
            </View>
            {HISTORICAL_DATA.map((d, i) => (
              <View key={i} style={[styles.tableRow, i % 2 === 0 && styles.tableRowEven]}>
                <Text style={[styles.tableCell, { flex: 1 }]}>{d.date}</Text>
                <Text style={[styles.tableCell, { color: Colors.primary, fontWeight: '600' }]}>{d.aqi}</Text>
                <Text style={styles.tableCell}>{d.pm25}</Text>
                <Text style={styles.tableCell}>{d.pm10}</Text>
                <Text style={styles.tableCell}>{d.no2}</Text>
                <Text style={styles.tableCell}>{d.o3}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Comparaison entre stations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comparaison des stations (AQI actuel)</Text>
          {STATIONS.map((s) => {
            const info = AQI_LEVELS[s.aqiLevel];
            const ratio = Math.min(s.aqi / 300, 1);
            return (
              <View key={s.id} style={styles.compareRow}>
                <Text style={styles.compareCity} numberOfLines={1}>{s.city}</Text>
                <View style={styles.compareBarBg}>
                  <View style={[styles.compareBarFill, { flex: ratio, backgroundColor: info.color }]} />
                  <View style={{ flex: 1 - ratio }} />
                </View>
                <Text style={[styles.compareValue, { color: info.color }]}>{s.aqi}</Text>
              </View>
            );
          })}
        </View>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.sm,
  },
  stationScroll: {
    gap: Spacing.xs,
  },
  stationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1.5,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pollutantChip: {
    borderWidth: 1.5,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    ...Shadows.sm,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    ...Typography.bodySmall,
    textAlign: 'center',
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  chartDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  chartContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  chartArea: {
    height: CHART_HEIGHT,
    position: 'relative',
    marginBottom: Spacing.xs,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.border,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CHART_HEIGHT,
    gap: 4,
    paddingTop: 24,
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: CHART_HEIGHT,
  },
  bar: {
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  barValue: {
    fontSize: 9,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  barLabel: {
    fontSize: 9,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  chartUnit: {
    fontSize: 10,
    color: Colors.textLight,
    textAlign: 'right',
    marginTop: 2,
  },
  table: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  tableRowEven: {
    backgroundColor: Colors.background,
  },
  tableHeader: {
    backgroundColor: Colors.primary,
  },
  tableCell: {
    width: 48,
    textAlign: 'center',
    fontSize: 12,
    color: Colors.text,
  },
  tableCellHeader: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 11,
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  compareCity: {
    width: 72,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  compareBarBg: {
    flex: 1,
    height: 10,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  compareBarFill: {
    height: 10,
    borderRadius: BorderRadius.full,
  },
  compareValue: {
    width: 32,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '700',
  },
});
