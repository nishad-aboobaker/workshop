import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { JobStatus, STATUS_COLORS, STATUS_LABELS } from '../types';

interface Props {
  status: JobStatus;
}

export default function StatusBadge({ status }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: STATUS_COLORS[status] }]}>
      <Text style={styles.text}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  text: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
