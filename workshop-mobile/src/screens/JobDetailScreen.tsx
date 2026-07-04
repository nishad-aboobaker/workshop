import React, { useCallback, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Linking,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Job, JobStatus, STATUS_LABELS, STATUS_COLORS, RepairItem } from '../types';
import { getJobById, updateJobStatus, deleteJobById } from '../database/database';
import { useTheme } from '../utils/ThemeContext';
import { generateWhatsAppLink, openWhatsApp } from '../utils/whatsapp';
import ServiceTimeline from '../components/ServiceTimeline';
import type { JobDetailScreenProps } from '../types/navigation';

const STATUS_FLOW: JobStatus[] = ['received', 'diagnosing', 'waiting_parts', 'in_repair', 'ready', 'delivered'];

export default function JobDetailScreen({ navigation, route }: JobDetailScreenProps) {
  const { Colors } = useTheme();
  const styles = React.useMemo(() => createStyles(Colors), [Colors]);
  
  const { jobId } = route.params;
  const [job, setJob] = useState<Job | null>(null);
  const [repairs, setRepairs] = useState<(any & { partsCost: string; labourCost: string })[]>([]);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'gpay' | 'split'>('cash');
  const [gpayAmount, setGpayAmount] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [loading, setLoading] = useState(false);

  const loadJob = useCallback(async () => {
    try {
      const data = await getJobById(jobId);
      if (data) {
        setJob(data);
        if (data.status !== 'ready' && data.status !== 'delivered') {
          const issues = data.issue_description.split(',').map(s => s.trim()).filter(s => s);
          setRepairs(
            issues.map(issue => ({
              job_id: data.id,
              issue,
              parts_cost: 0,
              labour_cost: 0,
              partsCost: '',
              labourCost: '',
            }))
          );
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load job');
    }
  }, [jobId]);

  useFocusEffect(
    useCallback(() => {
      loadJob();
    }, [loadJob])
  );

  const totalCost = repairs.reduce(
    (acc, r) => acc + (Number(r.partsCost) || 0) + (Number(r.labourCost) || 0),
    0
  );

  const currentStatusIndex = job ? STATUS_FLOW.indexOf(job.status) : -1;
  const nextStatus = currentStatusIndex >= 0 && currentStatusIndex < STATUS_FLOW.length - 2
    ? STATUS_FLOW[currentStatusIndex + 1]
    : null;

  const handleStatusUpdate = async (status: JobStatus) => {
    if (!job) return;
    setLoading(true);
    try {
      const updated = await updateJobStatus(job.id, { status, note: statusNote });
      if (updated) {
        setJob(updated);
        setStatusNote('');
        const link = generateWhatsAppLink(
          updated.customer_phone,
          updated.vehicle_number,
          updated.bike_model,
          updated.status,
          statusNote
        );
        Alert.alert('Status Updated', `Job status changed to ${STATUS_LABELS[status]}`, [
          { text: 'Send WhatsApp', onPress: () => openWhatsApp(link) },
          { text: 'OK' },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRepairCompleted = async () => {
    if (!job) return;
    setLoading(true);
    try {
      const repairData = repairs.map(r => ({
        issue: r.issue,
        partsCost: Number(r.partsCost) || 0,
        labourCost: Number(r.labourCost) || 0,
      }));
      const updated = await updateJobStatus(job.id, { repairs: repairData });
      if (updated) {
        setJob(updated);
        const link = generateWhatsAppLink(
          updated.customer_phone,
          updated.vehicle_number,
          updated.bike_model,
          updated.status,
          '',
          updated.total_charges
        );
        Alert.alert('Repair Completed', 'Vehicle is ready for pickup!', [
          { text: 'Send WhatsApp', onPress: () => openWhatsApp(link) },
          { text: 'OK' },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to mark repair completed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeliver = async () => {
    if (!job) return;
    let gpayAmt = 0;
    let cashAmt = 0;

    if (paymentMode === 'cash') {
      cashAmt = totalCost;
    } else if (paymentMode === 'gpay') {
      gpayAmt = totalCost;
    } else {
      gpayAmt = Number(gpayAmount) || 0;
      cashAmt = Number(cashAmount) || 0;
    }

    const paymentData = {
      mode: paymentMode,
      gpayAmount: gpayAmt,
      cashAmount: cashAmt,
      totalAmount: totalCost,
    };

    setLoading(true);
    try {
      const updated = await updateJobStatus(job.id, { payment: paymentData });
      if (updated) {
        setJob(updated);
        const link = generateWhatsAppLink(
          updated.customer_phone,
          updated.vehicle_number,
          updated.bike_model,
          updated.status,
          '',
          updated.total_charges,
          {
            job_id: updated.id,
            mode: paymentMode,
            gpay_amount: gpayAmt,
            cash_amount: cashAmt,
            total_amount: totalCost,
          }
        );
        Alert.alert('Delivered', 'Vehicle delivered successfully!', [
          { text: 'Send WhatsApp', onPress: () => openWhatsApp(link) },
          { text: 'OK' },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to complete delivery');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Job Card',
      'Are you sure you want to permanently delete this job card? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            if (!job) return;
            setLoading(true);
            try {
              await deleteJobById(job.id);
              Alert.alert('Deleted', 'Job card deleted successfully.', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete job');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (!job) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={100}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
      {/* Job Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Customer</Text>
          <Text style={styles.infoValue}>{job.customer_name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone</Text>
          <TouchableOpacity onPress={() => {
            Linking.openURL(`tel:${job.customer_phone}`).catch(() =>
              Alert.alert('Error', 'Phone dialer not available')
            );
          }} style={styles.phoneRow}>
            <Text style={styles.infoValue}>{job.customer_phone}</Text>
            <Text style={styles.phoneIcon}> 📞</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Bike Model</Text>
          <Text style={styles.infoValue}>{job.bike_model}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Vehicle Number</Text>
          <Text style={styles.infoValue}>{job.vehicle_number}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Issue Reported</Text>
          <Text style={styles.infoValue}>{job.issue_description}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Current Status</Text>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[job.status] }]}>
            <Text style={styles.statusText}>{STATUS_LABELS[job.status]}</Text>
          </View>
        </View>
      </View>

      {/* Status Flow (before ready) */}
      {job.status !== 'ready' && job.status !== 'delivered' && (
        <View style={styles.updateForm}>
          <Text style={styles.sectionTitle}>Update Status</Text>
          <View style={styles.statusButtons}>
            {STATUS_FLOW.slice(currentStatusIndex + 1, -1).map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.statusBtn, { backgroundColor: STATUS_COLORS[s] }]}
                onPress={() => handleStatusUpdate(s)}
                disabled={loading}
              >
                <Text style={styles.statusBtnText}>{STATUS_LABELS[s]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.noteInput}
            placeholder="Add a note (optional)"
            placeholderTextColor={Colors.textMuted}
            value={statusNote}
            onChangeText={setStatusNote}
          />
        </View>
      )}

      {/* Service Timeline */}
      <ServiceTimeline steps={job.steps || []} />

      {/* Stage 1: Repair Costing (before ready & delivered) */}
      {job.status !== 'ready' && job.status !== 'delivered' && (
        <View style={styles.updateForm}>
          <Text style={styles.sectionTitle}>Enter Repair Costs</Text>

          {repairs.map((repair, index) => (
            <View key={index} style={styles.repairItem}>
              <Text style={styles.repairTitle}>
                {index + 1}. {repair.issue}
              </Text>
              <View style={styles.costRow}>
                <View style={styles.costField}>
                  <Text style={styles.costLabel}>Parts (Rs.)</Text>
                  <TextInput
                    style={styles.costInput}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={Colors.textMuted}
                    value={repair.partsCost}
                    onChangeText={(text) => {
                      const updated = [...repairs];
                      updated[index].partsCost = text;
                      setRepairs(updated);
                    }}
                  />
                </View>
                <View style={styles.costField}>
                  <Text style={styles.costLabel}>Labour (Rs.)</Text>
                  <TextInput
                    style={styles.costInput}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={Colors.textMuted}
                    value={repair.labourCost}
                    onChangeText={(text) => {
                      const updated = [...repairs];
                      updated[index].labourCost = text;
                      setRepairs(updated);
                    }}
                  />
                </View>
              </View>
            </View>
          ))}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Cost:</Text>
            <Text style={styles.totalAmount}>Rs. {totalCost}</Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.disabledBtn]}
            onPress={handleMarkRepairCompleted}
            disabled={loading}
          >
            <Text style={styles.primaryBtnText}>
              {loading ? 'Processing...' : 'Mark Repair Completed'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Stage 2: Payment (when ready) */}
      {job.status === 'ready' && (
        <View style={styles.updateForm}>
          <Text style={styles.sectionTitle}>Vehicle Delivery & Payment</Text>

          <View style={styles.billSummary}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Billed:</Text>
              <Text style={styles.totalAmount}>Rs. {totalCost}</Text>
            </View>

            <Text style={styles.label}>Payment Mode</Text>
            <View style={styles.paymentModes}>
              {(['cash', 'gpay', 'split'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.modeBtn,
                    paymentMode === mode && styles.modeBtnActive,
                  ]}
                  onPress={() => setPaymentMode(mode)}
                >
                  <Text
                    style={[
                      styles.modeBtnText,
                      paymentMode === mode && styles.modeBtnTextActive,
                    ]}
                  >
                    {mode === 'cash' ? 'Cash' : mode === 'gpay' ? 'GPay / UPI' : 'Split'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {paymentMode === 'split' && (
              <View style={styles.splitRow}>
                <View style={styles.costField}>
                  <Text style={styles.costLabel}>GPay Amount</Text>
                  <TextInput
                    style={styles.costInput}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={Colors.textMuted}
                    value={gpayAmount}
                    onChangeText={setGpayAmount}
                  />
                </View>
                <View style={styles.costField}>
                  <Text style={styles.costLabel}>Cash Amount</Text>
                  <TextInput
                    style={styles.costInput}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={Colors.textMuted}
                    value={cashAmount}
                    onChangeText={setCashAmount}
                  />
                </View>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.disabledBtn]}
            onPress={handleDeliver}
            disabled={loading}
          >
            <Text style={styles.primaryBtnText}>
              {loading ? 'Processing...' : 'Mark Delivered & Send Bill'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Stage 3: Delivered Summary */}
      {job.status === 'delivered' && (
        <View style={styles.updateForm}>
          <Text style={[styles.sectionTitle, { color: '#27ae60' }]}>
            Vehicle Delivered
          </Text>
          {job.payment && (
            <View style={styles.deliveredSummary}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Total Billed</Text>
                <Text style={styles.infoValue}>Rs. {job.payment.total_amount}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Paid Via</Text>
                <Text style={[styles.infoValue, { textTransform: 'uppercase' }]}>
                  {job.payment.mode}
                </Text>
              </View>
              {job.payment.mode === 'split' && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Split</Text>
                  <Text style={styles.infoValue}>
                    GPay: Rs. {job.payment.gpay_amount} | Cash: Rs. {job.payment.cash_amount}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Delete Action */}
      <TouchableOpacity
        style={[styles.deleteBtn, loading && styles.disabledBtn]}
        onPress={handleDelete}
        disabled={loading}
      >
        <Text style={styles.deleteBtnText}>Delete Job Card</Text>
      </TouchableOpacity>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (Colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bg,
  },
  infoCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.textDark,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 4,
  },
  statusText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  updateForm: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 20,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statusBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  statusBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  noteInput: {
    backgroundColor: Colors.bg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 16,
    color: Colors.textDark,
  },
  repairItem: {
    backgroundColor: Colors.bg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  repairTitle: {
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 12,
    fontSize: 16,
  },
  costRow: {
    flexDirection: 'row',
    gap: 12,
  },
  costField: {
    flex: 1,
  },
  costLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  costInput: {
    backgroundColor: Colors.cardBgElevated,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 16,
    color: Colors.textDark,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textDark,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  billSummary: {
    backgroundColor: Colors.cardBgElevated,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 12,
    marginTop: 8,
  },
  paymentModes: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.bg,
  },
  modeBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  modeBtnText: {
    fontWeight: '600',
    fontSize: 14,
    color: Colors.textDark,
  },
  modeBtnTextActive: {
    color: Colors.white,
  },
  splitRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  deliveredSummary: {
    marginTop: 12,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneIcon: {
    fontSize: 16,
    marginLeft: 6,
  },
  deleteBtn: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.danger,
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteBtnText: {
    color: Colors.danger,
    fontSize: 16,
    fontWeight: '700',
  },
});
