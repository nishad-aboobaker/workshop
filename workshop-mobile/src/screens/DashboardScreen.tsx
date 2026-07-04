import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Job } from '../types';
import { useTheme } from '../utils/ThemeContext';
import { getAllJobs, searchJobs, getAllExpenses } from '../database/database';
import DashboardCard from '../components/DashboardCard';
import JobCard from '../components/JobCard';
import type { DashboardScreenProps } from '../types/navigation';

function isToday(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export default function DashboardScreen({ navigation }: DashboardScreenProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { Colors, theme, toggleTheme } = useTheme();

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={toggleTheme} style={{ marginRight: 16 }}>
          <Ionicons name={theme === 'dark' ? 'sunny' : 'moon'} size={24} color={Colors.textDark} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, theme, Colors, toggleTheme]);

  const loadJobs = useCallback(async () => {
    try {
      const data = await getAllJobs();
      const expData = await getAllExpenses();
      setJobs(data);
      setExpenses(expData);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to load jobs');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadJobs();
    }, [loadJobs])
  );

  const handleSearch = async (text: string) => {
    setSearchTerm(text);
    if (text.trim()) {
      const results = await searchJobs(text);
      setJobs(results);
    } else {
      loadJobs();
    }
  };

  const filteredJobs = searchTerm.trim()
    ? jobs
    : jobs;

  const pendingJobsCount = jobs.filter(j => j.status !== 'delivered').length;

  const totalCollected = jobs
    .filter(j => j.status === 'delivered' && isToday(j.delivered_at))
    .reduce((sum, j) => sum + (j.payment?.total_amount || 0), 0);

  const todayExpenses = expenses
    .filter(e => isToday(e.created_at))
    .reduce((sum, e) => sum + e.amount, 0);

  const todayProfit = totalCollected - todayExpenses;

  const styles = React.useMemo(() => createStyles(Colors), [Colors]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by vehicle number..."
          placeholderTextColor={Colors.textMuted}
          value={searchTerm}
          onChangeText={handleSearch}
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('NewJob')}
        >
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        <DashboardCard
          label="Pending Works"
          value={String(pendingJobsCount)}
          borderColor="#f59e0b" // warning
        />
        <DashboardCard
          label="Today's Collections"
          value={`Rs. ${totalCollected}`}
          borderColor="#0ea5e9" // primary
        />
      </View>
      <View style={styles.gridSecondRow}>
        <DashboardCard
          label="Today's Expenses"
          value={`Rs. ${todayExpenses}`}
          borderColor="#ef4444" // danger
        />
        <DashboardCard
          label="Today's Profit"
          value={`Rs. ${todayProfit}`}
          borderColor="#10b981" // success
        />
      </View>

      <FlatList
        style={{ flex: 1 }}
        data={filteredJobs}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <JobCard
            job={item}
            onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No jobs found.</Text>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 16,
    color: Colors.textDark,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: Colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  addButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  grid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  gridSecondRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  empty: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 16,
    fontStyle: 'italic',
  },
});
