import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Alert } from '../types';
import { AQI_LEVELS } from '../data/mockData';
import { Colors, Spacing, BorderRadius, Typography } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface AlertBannerProps {
  alert: Alert;
  onDismiss?: () => void;
}

export default function AlertBanner({ alert, onDismiss }: AlertBannerProps) {
  const info = AQI_LEVELS[alert.level];
  const time = new Date(alert.timestamp).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.container, { borderLeftColor: info.color, backgroundColor: info.color + '12' }]}>
      <View style={styles.iconWrapper}>
        <Ionicons name="warning" size={20} color={info.color} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.station, { color: info.color }]}>{alert.stationName}</Text>
        <Text style={styles.message}>{alert.message}</Text>
        <Text style={styles.time}>{time}</Text>
      </View>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  iconWrapper: {
    marginTop: 2,
  },
  body: {
    flex: 1,
  },
  station: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    ...Typography.bodySmall,
    lineHeight: 16,
  },
  time: {
    fontSize: 10,
    color: Colors.textLight,
    marginTop: 2,
  },
});
