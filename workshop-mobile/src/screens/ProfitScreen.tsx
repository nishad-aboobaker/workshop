import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../utils/ThemeContext';
import { getAllJobs, getAllExpenses } from '../database/database';

type FilterType = 'daily' | 'monthly' | 'yearly';

interface ProfitData {
  label: string;
  income: number;
  expense: number;
  profit: number;
}

export default function ProfitScreen() {
  const { Colors } = useTheme();
  const styles = React.useMemo(() => createStyles(Colors), [Colors]);

  const [data, setData] = useState<ProfitData[]>([]);
  const [filter, setFilter] = useState<FilterType>('daily');
  
  const loadData = useCallback(async () => {
    try {
      const jobs = await getAllJobs();
      const expenses = await getAllExpenses();

      const deliveredJobs = jobs.filter(j => j.status === 'delivered' && j.delivered_at);
      
      const grouped = new Map<string, ProfitData>();

      const getGroupKey = (dateStr: string) => {
        const d = new Date(dateStr);
        if (filter === 'daily') {
          return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        } else if (filter === 'monthly') {
          return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        } else {
          return d.toLocaleDateString('en-US', { year: 'numeric' });
        }
      };

      deliveredJobs.forEach(job => {
        const key = getGroupKey(job.delivered_at!);
        if (!grouped.has(key)) {
          grouped.set(key, { label: key, income: 0, expense: 0, profit: 0 });
        }
        const item = grouped.get(key)!;
        item.income += (job.payment?.total_amount || 0);
        item.profit += (job.payment?.total_amount || 0);
      });

      expenses.forEach(exp => {
        const key = getGroupKey(exp.created_at);
        if (!grouped.has(key)) {
          grouped.set(key, { label: key, income: 0, expense: 0, profit: 0 });
        }
        const item = grouped.get(key)!;
        item.expense += exp.amount;
        item.profit -= exp.amount;
      });

      setData(Array.from(grouped.values()));
    } catch (err) {
      console.error(err);
    }
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {(['daily', 'monthly', 'yearly'] as FilterType[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterBtnText, filter === f && styles.filterBtnTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={data}
        keyExtractor={item => item.label}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.dateText}>{item.label}</Text>
              <View style={[styles.profitBadge, { backgroundColor: item.profit >= 0 ? Colors.success : Colors.danger }]}>
                <Text style={styles.profitText}>Rs. {item.profit}</Text>
              </View>
            </View>
            <View style={styles.breakdown}>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Income</Text>
                <Text style={[styles.breakdownValue, { color: Colors.primary }]}>Rs. {item.income}</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Expense</Text>
                <Text style={[styles.breakdownValue, { color: Colors.danger }]}>Rs. {item.expense}</Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No financial data available yet.</Text>
          </View>
        }
      />
    </View>
  );
}

const createStyles = (Colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  filterRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cardBg,
  },
  filterBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterBtnText: {
    color: Colors.textMuted,
    fontWeight: '600',
  },
  filterBtnTextActive: {
    color: Colors.white,
  },
  list: {
    paddingHorizontal: 16,
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
  profitBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  profitText: {
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
