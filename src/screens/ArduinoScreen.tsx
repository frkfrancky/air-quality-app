import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useArduinoData } from '../hooks/useArduinoData';
import { DEFAULT_ARDUINO_IP, DEFAULT_ARDUINO_PORT } from '../services/arduinoService';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../theme';
import { ArduinoData } from '../types';

const INTERVALS = [
  { label: '2 s', value: 2000 },
  { label: '5 s', value: 5000 },
  { label: '10 s', value: 10000 },
  { label: '30 s', value: 30000 },
];

function fmt(val: number | undefined, decimals = 1): string {
  if (val === undefined || val === null) return '—';
  return Number(val).toFixed(decimals);
}

function formatTime(date: Date | null): string {
  if (!date) return '—';
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

interface SensorRowProps {
  icon: string;
  label: string;
  value: string;
  unit?: string;
  iconColor?: string;
}

function SensorRow({ icon, label, value, unit, iconColor }: SensorRowProps) {
  return (
    <View style={styles.sensorRow}>
      <View style={[styles.sensorIcon, { backgroundColor: (iconColor ?? Colors.primary) + '18' }]}>
        <Ionicons name={icon as any} size={18} color={iconColor ?? Colors.primary} />
      </View>
      <Text style={styles.sensorLabel}>{label}</Text>
      <Text style={styles.sensorValue}>
        {value}
        {unit ? <Text style={styles.sensorUnit}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

interface SectionCardProps {
  title: string;
  icon: string;
  iconColor?: string;
  children: React.ReactNode;
}

function SectionCard({ title, icon, iconColor, children }: SectionCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name={icon as any} size={16} color={iconColor ?? Colors.primary} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function RGBPreview({ r, g, b }: { r: number; g: number; b: number }) {
  // Normalize to 0-255 range (raw sensor values may vary)
  const max = Math.max(r, g, b, 1);
  const nr = Math.round((r / max) * 255);
  const ng = Math.round((g / max) * 255);
  const nb = Math.round((b / max) * 255);
  const color = `rgb(${nr},${ng},${nb})`;

  return (
    <View style={styles.rgbRow}>
      <View style={[styles.rgbSwatch, { backgroundColor: color }]} />
      <View style={styles.rgbChannels}>
        <Text style={styles.rgbChannel}>R <Text style={styles.rgbVal}>{r}</Text></Text>
        <Text style={styles.rgbChannel}>G <Text style={styles.rgbVal}>{g}</Text></Text>
        <Text style={styles.rgbChannel}>B <Text style={styles.rgbVal}>{b}</Text></Text>
      </View>
    </View>
  );
}

function AccelBar({ value, max = 2 }: { value: number; max?: number }) {
  const clampedAbs = Math.min(Math.abs(value), max);
  const pct = clampedAbs / max;
  const positive = value >= 0;
  return (
    <View style={styles.accelBarTrack}>
      <View style={styles.accelBarCenter} />
      <View
        style={[
          styles.accelBarFill,
          {
            width: `${pct * 50}%` as any,
            [positive ? 'left' : 'right']: '50%',
            backgroundColor: positive ? Colors.primary : Colors.secondary,
          },
        ]}
      />
    </View>
  );
}

export default function ArduinoScreen() {
  const [ip, setIp] = useState(DEFAULT_ARDUINO_IP);
  const [port] = useState(DEFAULT_ARDUINO_PORT);
  const [intervalMs, setIntervalMs] = useState(5000);
  const [configVisible, setConfigVisible] = useState(false);
  const [ipDraft, setIpDraft] = useState('10.19.128.179');

  const { data, status, error, lastUpdated, refresh } = useArduinoData(ip, port, intervalMs);

  const applyConfig = () => {
    setIp(ipDraft.trim());
    setConfigVisible(false);
  };

  const isConnected = status === 'connected';
  const isLoading = status === 'loading' || status === 'idle';

  const statusColor =
    status === 'connected' ? Colors.success :
    status === 'error' ? Colors.error :
    Colors.warning;

  const statusLabel =
    status === 'connected' ? 'Connecté' :
    status === 'error' ? 'Hors ligne' :
    'Connexion…';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: Colors.primary }]}>
        <View>
          <Text style={styles.headerTitle}>Capteur Arduino</Text>
          <Text style={styles.headerSub}>Opla IoT Carrier — temps réel</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={refresh}>
            {isLoading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="refresh" size={20} color="#fff" />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => { setIpDraft(ip); setConfigVisible(true); }}>
            <Ionicons name="settings-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Status bar */}
      <View style={[styles.statusBar, { backgroundColor: statusColor + '18', borderColor: statusColor + '40' }]}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
        <Text style={styles.statusAddress}>{ip}:{port}</Text>
        <Text style={styles.statusTime}>
          {isConnected ? `Mis à jour ${formatTime(lastUpdated)}` : error ?? ''}
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* Interval selector */}
        <View style={styles.intervalRow}>
          <Text style={styles.intervalLabel}>Intervalle :</Text>
          {INTERVALS.map((i) => (
            <TouchableOpacity
              key={i.value}
              style={[styles.intervalChip, intervalMs === i.value && styles.intervalChipActive]}
              onPress={() => setIntervalMs(i.value)}
            >
              <Text style={[styles.intervalChipText, intervalMs === i.value && styles.intervalChipTextActive]}>
                {i.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* No data placeholder */}
        {!data && status !== 'loading' && status !== 'idle' && (
          <View style={styles.placeholder}>
            <Ionicons name="hardware-chip-outline" size={48} color={Colors.textLight} />
            <Text style={styles.placeholderText}>Aucune donnée reçue</Text>
            {error && <Text style={styles.placeholderError}>{error}</Text>}
          </View>
        )}

        {/* Loading placeholder */}
        {!data && (status === 'loading' || status === 'idle') && (
          <View style={styles.placeholder}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.placeholderText}>Connexion à l'Arduino…</Text>
          </View>
        )}

        {data && (
          <>
            {/* Environnement */}
            <SectionCard title="Environnement" icon="thermometer-outline" iconColor="#E53935">
              <SensorRow icon="thermometer" label="Température" value={fmt(data.temperature)} unit="°C" iconColor="#E53935" />
              <SensorRow icon="water-outline" label="Humidité" value={fmt(data.humidity)} unit="%" iconColor="#1E88E5" />
              <SensorRow icon="speedometer-outline" label="Pression" value={fmt(data.pressure, 1)} unit="hPa" iconColor="#7B1FA2" />
            </SectionCard>

            {/* Lumière */}
            <SectionCard title="Lumière" icon="sunny-outline" iconColor="#F57F17">
              <SensorRow icon="sunny" label="Luminosité" value={fmt(data.lux, 0)} unit="lux" iconColor="#F57F17" />
              <View style={styles.sensorRow}>
                <View style={[styles.sensorIcon, { backgroundColor: '#E0E0E0' }]}>
                  <Ionicons name="color-palette-outline" size={18} color="#555" />
                </View>
                <Text style={styles.sensorLabel}>Couleur RGB</Text>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <RGBPreview r={data.red} g={data.green} b={data.blue} />
                </View>
              </View>
              <SensorRow icon="eye-outline" label="Proximité" value={fmt(data.proximity, 0)} iconColor="#00897B" />
            </SectionCard>

            {/* Accéléromètre */}
            <SectionCard title="Accéléromètre" icon="navigate-outline" iconColor="#43A047">
              {(['accel_x', 'accel_y', 'accel_z'] as const).map((axis) => {
                const axisLabel = axis.replace('accel_', '').toUpperCase();
                const val = data[axis as keyof ArduinoData] as number;
                return (
                  <View key={axis} style={styles.accelRow}>
                    <Text style={styles.accelAxis}>{axisLabel}</Text>
                    <AccelBar value={val} />
                    <Text style={styles.accelValue}>{fmt(val, 3)} g</Text>
                  </View>
                );
              })}
            </SectionCard>
          </>
        )}
      </ScrollView>

      {/* Config modal */}
      <Modal visible={configVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configuration Arduino</Text>
              <TouchableOpacity onPress={() => setConfigVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Adresse IP de l'Arduino</Text>
              <TextInput
                style={styles.input}
                value={ipDraft}
                onChangeText={setIpDraft}
                placeholder="10.19.128.179"
                placeholderTextColor={Colors.textLight}
                autoCapitalize="none"
                keyboardType="decimal-pad"
              />
              <Text style={styles.inputHint}>Port : {port} (fixe) — Endpoint : /data</Text>

              <TouchableOpacity style={styles.applyBtn} onPress={applyConfig}>
                <Text style={styles.applyBtnText}>Appliquer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'web' ? Spacing.md : Spacing.sm,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusAddress: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  statusTime: {
    flex: 1,
    fontSize: 11,
    color: Colors.textLight,
    textAlign: 'right',
  },
  scroll: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  intervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
  },
  intervalLabel: {
    ...Typography.label,
    marginRight: Spacing.xs,
  },
  intervalChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  intervalChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  intervalChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  intervalChipTextActive: {
    color: '#fff',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cardTitle: {
    ...Typography.h4,
    fontSize: 14,
  },
  sensorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  sensorIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sensorLabel: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
  },
  sensorValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  sensorUnit: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  rgbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rgbSwatch: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rgbChannels: {
    flexDirection: 'row',
    gap: 8,
  },
  rgbChannel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  rgbVal: {
    color: Colors.text,
    fontWeight: '700',
  },
  accelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  accelAxis: {
    width: 20,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  accelBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.background,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  accelBarCenter: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: Colors.border,
  },
  accelBarFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 4,
  },
  accelValue: {
    width: 72,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'right',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  placeholderText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  placeholderError: {
    fontSize: 12,
    color: Colors.error,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    ...Typography.h3,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  inputLabel: {
    ...Typography.label,
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 9,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  inputHint: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  applyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
