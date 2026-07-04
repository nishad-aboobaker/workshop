import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { Job } from '../types';
import { useTheme } from '../utils/ThemeContext';
import StatusBadge from './StatusBadge';

interface Props {
  job: Job;
  onPress: () => void;
}

function callCustomer(phone: string) {
  Linking.openURL(`tel:${phone}`).catch(() =>
    Alert.alert('Error', 'Phone dialer not available')
  );
}

export default function JobCard({ job, onPress }: Props) {
  const { Colors } = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.top}>
        <Text style={styles.name}>{job.customer_name}</Text>
        <StatusBadge status={job.status} />
      </View>
      <View style={styles.meta}>
        <Text style={styles.metaText}>
          <Text style={styles.bold}>Bike:</Text> {job.bike_model}
        </Text>
        <Text style={styles.dot}>•</Text>
        <Text style={styles.metaText}>
          <Text style={styles.bold}>No:</Text> {job.vehicle_number}
        </Text>
        <Text style={styles.dot}>•</Text>
        <TouchableOpacity onPress={() => callCustomer(job.customer_phone)} style={styles.phoneRow}>
          <Text style={styles.metaText}>
            <Text style={styles.bold}>Phone:</Text> {job.customer_phone}
          </Text>
          <Text style={styles.callIcon}> 📞</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.issue}>
        <Text style={styles.issueText} numberOfLines={2}>
          {job.issue_description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (Colors: any) => StyleSheet.create({
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callIcon: {
    fontSize: 13,
    marginLeft: 2,
  },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  name: {
    fontWeight: '700',
    fontSize: 18,
    color: Colors.textDark,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  metaText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  dot: {
    fontSize: 14,
    color: Colors.textMuted,
    marginHorizontal: 8,
  },
  bold: {
    fontWeight: '700',
    color: Colors.textDark,
  },
  issue: {
    backgroundColor: Colors.cardBgElevated,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  issueText: {
    fontSize: 14,
    color: Colors.textDark,
    fontStyle: 'italic',
  },
});
