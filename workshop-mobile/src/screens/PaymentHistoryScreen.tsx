import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Job, DailyRevenue } from '../types';
import { useTheme } from '../utils/ThemeContext';
import { getAllJobs } from '../database/database';

export default function PaymentHistoryScreen() {
  const { Colors } = useTheme();
  const styles = React.useMemo(() => createStyles(Colors), [Colors]);

  const [dailyRevenues, setDailyRevenues] = useState<DailyRevenue[]>([]);

  const loadData = useCallback(async () => {
    try {
      const jobs = await getAllJobs();
      const deliveredJobs = jobs.filter(j => j.status === 'delivered' && j.delivered_at);

      const grouped = new Map<string, DailyRevenue>();

      deliveredJobs.forEach(job => {
        const dateObj = new Date(job.delivered_at!);
        const dateStr = dateObj.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });

        if (!grouped.has(dateStr)) {
          grouped.set(dateStr, { dateStr, cash: 0, gpay: 0, total: 0 });
        }

        const day = grouped.get(dateStr)!;
        day.cash += (job.payment?.cash_amount || 0);
        day.gpay += (job.payment?.gpay_amount || 0);
        day.total += (job.payment?.total_amount || 0);
      });

      setDailyRevenues(Array.from(grouped.values()));
    } catch (err) {
      console.error(err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={dailyRevenues}
        keyExtractor={(item) => item.dateStr}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.dateText}>{item.dateStr}</Text>
              <View style={styles.totalBadge}>
                <Text style={styles.totalText}>Rs. {item.total}</Text>
              </View>
            </View>
            <View style={styles.breakdown}>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Cash Collected</Text>
                <Text style={styles.breakdownValue}>Rs. {item.cash}</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>GPay / UPI Collected</Text>
                <Text style={styles.breakdownValue}>Rs. {item.gpay}</Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No payment history found yet.</Text>
          </View>
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const createStyles = (Colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textDark,
  },
  totalBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  totalText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  breakdown: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBgElevated,
    padding: 16,
    borderRadius: 12,
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  breakdownItem: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  breakdownValue: {
    fontSize: 18,
    color: Colors.textDark,
    fontWeight: '700',
    marginTop: 4,
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 16,
    fontStyle: 'italic',
  },
});
