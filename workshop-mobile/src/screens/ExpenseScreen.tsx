import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../utils/ThemeContext';
import { Expense } from '../types';
import { addExpense, getAllExpenses, deleteExpenseById } from '../database/database';
import { Ionicons } from '@expo/vector-icons';

export interface GroupedExpense {
  dateStr: string;
  total: number;
  data: Expense[];
}

export default function ExpenseScreen() {
  const { Colors } = useTheme();
  const styles = React.useMemo(() => createStyles(Colors), [Colors]);

  const [groupedExpenses, setGroupedExpenses] = useState<GroupedExpense[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const loadExpenses = useCallback(async () => {
    try {
      const data = await getAllExpenses();
      
      let sum = 0;
      const grouped = new Map<string, GroupedExpense>();

      data.forEach(expense => {
        sum += expense.amount;
        const dateObj = new Date(expense.created_at);
        const dateStr = dateObj.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });

        if (!grouped.has(dateStr)) {
          grouped.set(dateStr, { dateStr, total: 0, data: [] });
        }

        const day = grouped.get(dateStr)!;
        day.total += expense.amount;
        day.data.push(expense);
      });

      setGroupedExpenses(Array.from(grouped.values()));
      setTotalExpenses(sum);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to load expenses');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [loadExpenses])
  );

  const handleAddExpense = async () => {
    if (!description.trim() || !amount.trim()) {
      Alert.alert('Error', 'Please enter description and amount');
      return;
    }
    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await addExpense(description.trim(), amountNum);
      setDescription('');
      setAmount('');
      loadExpenses();
    } catch (err: any) {
      Alert.alert('Error', 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteExpenseById(id);
            loadExpenses();
          } catch (err: any) {
            Alert.alert('Error', 'Failed to delete expense');
          }
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Add Expense Form */}
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Expense Description (e.g., Engine Oil)"
          placeholderTextColor={Colors.textMuted}
          value={description}
          onChangeText={setDescription}
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Amount (Rs.)"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={handleAddExpense}
            disabled={loading}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Expenses</Text>
        <Text style={styles.summaryValue}>Rs. {totalExpenses}</Text>
      </View>

      {/* Expense List */}
      <FlatList
        data={groupedExpenses}
        keyExtractor={(item) => item.dateStr}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.dayGroup}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayHeaderText}>{item.dateStr}</Text>
              <Text style={styles.dayTotalText}>Rs. {item.total}</Text>
            </View>
            {item.data.map((expense) => (
              <View key={expense.id} style={styles.expenseCard}>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseDesc}>{expense.description}</Text>
                </View>
                <Text style={styles.expenseAmount}>Rs. {expense.amount}</Text>
                <TouchableOpacity onPress={() => handleDelete(expense.id)} style={styles.deleteIcon}>
                  <Ionicons name="trash-outline" size={20} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No expenses recorded.</Text>
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
  formContainer: {
    padding: 16,
    backgroundColor: Colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  input: {
    backgroundColor: Colors.bg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 16,
    color: Colors.textDark,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  addButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  summaryCard: {
    margin: 16,
    padding: 20,
    backgroundColor: Colors.cardBgElevated,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryLabel: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  summaryValue: {
    color: Colors.danger, // Red color indicates outgoing money
    fontSize: 28,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  dayGroup: {
    marginBottom: 20,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 8,
  },
  dayHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
  },
  dayTotalText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.danger,
  },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDesc: {
    color: Colors.textDark,
    fontSize: 16,
    fontWeight: '600',
  },
  expenseAmount: {
    color: Colors.textDark,
    fontSize: 16,
    fontWeight: '700',
    marginRight: 16,
  },
  deleteIcon: {
    padding: 4,
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
