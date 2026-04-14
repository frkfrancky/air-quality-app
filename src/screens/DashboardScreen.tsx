import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { STATIONS, ALERTS, AQI_LEVELS } from '../data/mockData';
import { Station } from '../types';
import AQIGauge from '../components/AQIGauge';
import PollutantCard from '../components/PollutantCard';
import StationCard from '../components/StationCard';
import AlertBanner from '../components/AlertBanner';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../theme';

export default function DashboardScreen() {
  const [selectedStation, setSelectedStation] = useState<Station>(STATIONS[0]);
  const [modalVisible, setModalVisible] = useState(false);
  const [alerts, setAlerts] = useState(ALERTS.filter((a) => !a.isRead));

  const activeAlerts = alerts.filter((a) => !a.isRead);
  const aqiInfo = AQI_LEVELS[selectedStation.aqiLevel];

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={[styles.header, { backgroundColor: Colors.primary }]}>
        <View>
          <Text style={styles.headerTitle}>Qualité de l'Air</Text>
          <Text style={styles.headerSub}>Médiation des données environnementales</Text>
        </View>
        <TouchableOpacity style={styles.stationSelector} onPress={() => setModalVisible(true)}>
          <Ionicons name="location" size={14} color="#fff" />
          <Text style={styles.stationSelectorText} numberOfLines={1}>{selectedStation.city}</Text>
          <Ionicons name="chevron-down" size={14} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Alerts */}
        {activeAlerts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="alert-circle" size={16} color={Colors.error} />
              <Text style={[styles.sectionTitle, { color: Colors.error }]}>
                Alertes actives ({activeAlerts.length})
              </Text>
            </View>
            {activeAlerts.map((alert) => (
              <AlertBanner key={alert.id} alert={alert} onDismiss={() => dismissAlert(alert.id)} />
            ))}
          </View>
        )}

        {/* Station principale */}
        <View style={[styles.mainCard, { backgroundColor: Colors.primary }]}>
          <Text style={styles.mainCardTitle}>{selectedStation.name}</Text>
          <Text style={styles.mainCardSub}>{selectedStation.city} — {selectedStation.type}</Text>
          <View style={styles.mainCardBody}>
            <AQIGauge aqi={selectedStation.aqi} level={selectedStation.aqiLevel} size="large" />
            <View style={styles.mainCardInfo}>
              <Text style={styles.infoLabel}>Description</Text>
              <Text style={styles.infoText}>{aqiInfo.description}</Text>
              <View style={styles.separator} />
              <Text style={styles.infoLabel}>Conseil</Text>
              <Text style={styles.infoText}>{aqiInfo.advice}</Text>
              <View style={styles.separator} />
              <Text style={styles.infoLabel}>Indice</Text>
              <Text style={styles.infoText}>{aqiInfo.range}</Text>
            </View>
          </View>
        </View>

        {/* Polluants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Polluants mesurés</Text>
          {selectedStation.pollutants.map((p) => (
            <PollutantCard key={p.id} pollutant={p} />
          ))}
        </View>

        {/* Autres stations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Autres stations</Text>
          {STATIONS.filter((s) => s.id !== selectedStation.id).map((s) => (
            <StationCard
              key={s.id}
              station={s}
              compact
              onPress={() => setSelectedStation(s)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Modal sélection station */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choisir une station</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {STATIONS.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.modalItem,
                    s.id === selectedStation.id && styles.modalItemActive,
                  ]}
                  onPress={() => {
                    setSelectedStation(s);
                    setModalVisible(false);
                  }}
                >
                  <View style={[styles.modalDot, { backgroundColor: AQI_LEVELS[s.aqiLevel].color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalItemName}>{s.name}</Text>
                    <Text style={styles.modalItemCity}>{s.city}</Text>
                  </View>
                  <Text style={[styles.modalItemAqi, { color: AQI_LEVELS[s.aqiLevel].color }]}>
                    {s.aqi}
                  </Text>
                  {s.id === selectedStation.id && (
                    <Ionicons name="checkmark" size={18} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
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
  stationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
    maxWidth: 140,
  },
  stationSelectorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  scroll: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.sm,
  },
  mainCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  mainCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  mainCardSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: Spacing.lg,
    textTransform: 'capitalize',
  },
  mainCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  mainCardInfo: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 17,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: Spacing.xs,
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
    maxHeight: 600,
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
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalItemActive: {
    backgroundColor: Colors.primary + '0A',
  },
  modalDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  modalItemName: {
    ...Typography.body,
    fontWeight: '500',
  },
  modalItemCity: {
    ...Typography.bodySmall,
  },
  modalItemAqi: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 4,
  },
});
