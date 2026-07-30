import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AQI_LEVELS } from '../data/mockData';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../theme';

interface SettingRowProps {
  icon: string;
  iconColor?: string;
  label: string;
  description?: string;
  value?: boolean;
  onToggle?: (val: boolean) => void;
  onPress?: () => void;
  rightText?: string;
}

function SettingRow({ icon, iconColor = Colors.primary, label, description, value, onToggle, onPress, rightText }: SettingRowProps) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={[styles.settingIcon, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && <Text style={styles.settingDesc}>{description}</Text>}
      </View>
      {onToggle !== undefined && (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: Colors.border, true: Colors.primary + '80' }}
          thumbColor={value ? Colors.primary : '#f4f3f4'}
        />
      )}
      {rightText && <Text style={styles.rightText}>{rightText}</Text>}
      {onPress && <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showThresholds, setShowThresholds] = useState(true);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.header, { backgroundColor: Colors.primary }]}>
        <Text style={styles.headerTitle}>Paramètres</Text>
        <Text style={styles.headerSub}>Configuration de l'application</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Notifications */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>Notifications</Text>
          <View style={styles.card}>
            <SettingRow
              icon="notifications"
              iconColor={Colors.primary}
              label="Notifications push"
              description="Recevoir des alertes en temps réel"
              value={notifications}
              onToggle={setNotifications}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="warning"
              iconColor={Colors.aqi.degrade}
              label="Alertes de dépassement"
              description="Notifier lors du dépassement de seuils"
              value={alertsEnabled}
              onToggle={setAlertsEnabled}
            />
          </View>
        </View>

        {/* Affichage */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>Affichage</Text>
          <View style={styles.card}>
            <SettingRow
              icon="moon"
              iconColor="#5C6BC0"
              label="Mode sombre"
              description="Thème sombre de l'interface"
              value={darkMode}
              onToggle={setDarkMode}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="pulse"
              iconColor={Colors.secondary}
              label="Afficher les seuils"
              description="Montrer les seuils réglementaires"
              value={showThresholds}
              onToggle={setShowThresholds}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="refresh"
              iconColor={Colors.success}
              label="Actualisation automatique"
              description="Rafraîchir les données toutes les 10 min"
              value={autoRefresh}
              onToggle={setAutoRefresh}
            />
          </View>
        </View>

        {/* Données */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>Données</Text>
          <View style={styles.card}>
            <SettingRow
              icon="cloud-download"
              iconColor={Colors.primary}
              label="Source des données"
              rightText="Atmo France"
              onPress={() => {}}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="time"
              iconColor={Colors.textSecondary}
              label="Fréquence de mise à jour"
              rightText="10 min"
              onPress={() => {}}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="trash"
              iconColor={Colors.error}
              label="Vider le cache local"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Référentiel AQI */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>Référentiel IQA</Text>
          <View style={styles.card}>
            {Object.values(AQI_LEVELS).map((level, index, arr) => (
              <React.Fragment key={level.level}>
                <View style={styles.aqiRow}>
                  <View style={[styles.aqiDot, { backgroundColor: level.color }]} />
                  <View style={styles.aqiInfo}>
                    <View style={styles.aqiTop}>
                      <Text style={styles.aqiLabel}>{level.label}</Text>
                      <Text style={[styles.aqiRange, { color: level.color }]}>{level.range}</Text>
                    </View>
                    <Text style={styles.aqiDesc}>{level.advice}</Text>
                  </View>
                </View>
                {index < arr.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* À propos */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>À propos</Text>
          <View style={styles.card}>
            <SettingRow
              icon="information-circle"
              iconColor={Colors.secondary}
              label="Version de l'application"
              rightText="1.0.0"
            />
            <View style={styles.divider} />
            <SettingRow
              icon="document-text"
              iconColor={Colors.textSecondary}
              label="Mentions légales"
              onPress={() => {}}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="shield-checkmark"
              iconColor={Colors.success}
              label="Politique de confidentialité"
              onPress={() => {}}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>..</Text>
          <Text style={styles.footerText}>..</Text>
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
  group: {
    marginBottom: Spacing.lg,
  },
  groupTitle: {
    ...Typography.label,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    ...Typography.body,
    fontWeight: '500',
  },
  settingDesc: {
    ...Typography.bodySmall,
    marginTop: 1,
  },
  rightText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 56,
  },
  aqiRow: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  aqiDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 3,
  },
  aqiInfo: {
    flex: 1,
  },
  aqiTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  aqiLabel: {
    ...Typography.body,
    fontWeight: '600',
  },
  aqiRange: {
    fontSize: 12,
    fontWeight: '700',
  },
  aqiDesc: {
    ...Typography.bodySmall,
    lineHeight: 16,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  footerText: {
    fontSize: 11,
    color: Colors.textLight,
    textAlign: 'center',
  },
});
