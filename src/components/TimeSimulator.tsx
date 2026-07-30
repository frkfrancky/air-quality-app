import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { Colors, Spacing, BorderRadius, Typography } from '../theme';

interface TimeSimulatorProps {
  value: Date;
  onChange: (date: Date) => void;
}

const MINUTES_IN_DAY = 24 * 60;

export default function TimeSimulator({ value, onChange }: TimeSimulatorProps) {
  const minutesOfDay = value.getHours() * 60 + value.getMinutes();
  const timeLabel = value.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const handleSlide = (minutes: number) => {
    const next = new Date(value);
    next.setHours(Math.floor(minutes / 60), Math.round(minutes % 60), 0, 0);
    onChange(next);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simuler l'heure</Text>
      <Text style={styles.time}>{timeLabel}</Text>

      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={MINUTES_IN_DAY - 1}
        step={5}
        value={minutesOfDay}
        onValueChange={handleSlide}
        minimumTrackTintColor={Colors.primary}
        maximumTrackTintColor={Colors.border}
        thumbTintColor={Colors.primary}
      />

      <View style={styles.bounds}>
        <Text style={styles.boundLabel}>00:00</Text>
        <Text style={styles.boundLabel}>23:59</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  title: {
    ...Typography.h4,
    marginBottom: Spacing.xs,
  },
  time: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  bounds: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  boundLabel: {
    ...Typography.bodySmall,
  },
});
