import React, { useEffect, useState } from 'react';
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
import { CityLayers } from '../components/CityScene';
import { loadDefaultCityLayers, saveDefaultCityLayers } from '../services/preferences';
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

// Mêmes couches et libellés que le panneau de la page Ville (CityLayersPanel) : ce réglage ne fait
// que choisir leur état au moment où cette page s'ouvre, mémorisé pour les prochaines fois.
const CITY_LAYER_ITEMS: { key: keyof CityLayers; icon: string; iconColor: string; label: string }[] = [
  { key: 'aqi', icon: 'analytics', iconColor: Colors.primary, label: "Indice de la qualité de l'air" },
  { key: 'pm25', icon: 'cloud', iconColor: '#5C6BC0', label: 'Particule fine PM2.5' },
  { key: 'pm10', icon: 'cloud-outline', iconColor: '#8D6E63', label: 'Particule fine PM10' },
  { key: 'traffic', icon: 'car', iconColor: Colors.textSecondary, label: 'Pollution automobile' },
  { key: 'ozone', icon: 'sunny', iconColor: '#F57F17', label: 'Ozone' },
  { key: 'weather', icon: 'rainy', iconColor: '#1E88E5', label: 'Condition météo' },
];

export default function SettingsScreen() {
  const [cityLayers, setCityLayers] = useState<CityLayers | null>(null);

  useEffect(() => {
    loadDefaultCityLayers().then(setCityLayers);
  }, []);

  const toggleCityLayer = (key: keyof CityLayers) => {
    if (!cityLayers) return;
    const next = { ...cityLayers, [key]: !cityLayers[key] };
    setCityLayers(next);
    saveDefaultCityLayers(next);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.header, { backgroundColor: Colors.primary }]}>
        <Text style={styles.headerTitle}>Paramètres</Text>
        <Text style={styles.headerSub}>Configuration de l'application</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Ville : couches affichées par défaut */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>Ville — couches affichées par défaut</Text>
          {cityLayers && (
            <View style={styles.card}>
              {CITY_LAYER_ITEMS.map((item, index) => (
                <React.Fragment key={item.key}>
                  <SettingRow
                    icon={item.icon}
                    iconColor={item.iconColor}
                    label={item.label}
                    value={cityLayers[item.key]}
                    onToggle={() => toggleCityLayer(item.key)}
                  />
                  {index < CITY_LAYER_ITEMS.length - 1 && <View style={styles.divider} />}
                </React.Fragment>
              ))}
            </View>
          )}
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
});
