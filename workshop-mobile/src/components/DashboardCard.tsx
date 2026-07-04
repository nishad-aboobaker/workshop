import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../utils/ThemeContext';

interface Props {
  label: string;
  value: string;
  borderColor: string;
}

export default function DashboardCard({ label, value, borderColor }: Props) {
  const { Colors } = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);

  return (
    <View style={[styles.card, { borderLeftColor: borderColor, borderLeftWidth: 4 }]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const createStyles = (Colors: any) => StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    color: Colors.textDark,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
  },
});
