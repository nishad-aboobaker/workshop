import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { JobStep } from '../types';
import { useTheme } from '../utils/ThemeContext';

interface Props {
  steps: JobStep[];
}

export default function ServiceTimeline({ steps }: Props) {
  const { Colors } = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);

  if (!steps || steps.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Service History</Text>
      {steps.map((step, index) => (
        <View key={step.id || index} style={styles.step}>
          <View style={styles.dot} />
          <View style={styles.content}>
            <Text style={styles.label}>{step.label}</Text>
            {step.note ? <Text style={styles.note}>{step.note}</Text> : null}
            <Text style={styles.time}>
              {new Date(step.timestamp).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const createStyles = (Colors: any) => StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 20,
  },
  step: {
    flexDirection: 'row',
    paddingLeft: 20,
    paddingBottom: 20,
    borderLeftWidth: 2,
    borderLeftColor: Colors.border,
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    left: -6,
    top: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 1,
  },
  content: {
    paddingLeft: 12,
    flex: 1,
  },
  label: {
    fontWeight: '600',
    fontSize: 16,
    color: Colors.textDark,
    marginBottom: 4,
  },
  note: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#64748b', // Lighter muted for time
  },
});
