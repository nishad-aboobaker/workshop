import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { createJob } from '../database/database';
import { generateWhatsAppLink, openWhatsApp } from '../utils/whatsapp';
import type { NewJobScreenProps } from '../types/navigation';

export default function NewJobScreen({ navigation }: NewJobScreenProps) {
  const { Colors } = useTheme();
  const styles = React.useMemo(() => createStyles(Colors), [Colors]);
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [bikeModel, setBikeModel] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!customerName.trim() || !customerPhone.trim() || !bikeModel.trim() || !issueDescription.trim()) {
      Alert.alert('Validation', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const job = await createJob({
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        bike_model: bikeModel.trim(),
        vehicle_number: vehicleNumber.trim(),
        issue_description: issueDescription.trim(),
      });

      const link = generateWhatsAppLink(
        job.customer_phone,
        job.vehicle_number,
        job.bike_model,
        job.status
      );

      Alert.alert('Job Created', 'Job card created successfully!', [
        { text: 'Send WhatsApp', onPress: () => openWhatsApp(link) },
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior="padding"
      keyboardVerticalOffset={100}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create New Job Card</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Customer Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter customer name"
            placeholderTextColor={Colors.textMuted}
            value={customerName}
            onChangeText={setCustomerName}
          />

          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="10-digit mobile number"
            placeholderTextColor={Colors.textMuted}
            keyboardType="phone-pad"
            value={customerPhone}
            onChangeText={setCustomerPhone}
          />

          <Text style={styles.label}>Bike Model *</Text>
          <TextInput
            style={styles.input}
            placeholder="E.g., Honda Activa 6G"
            placeholderTextColor={Colors.textMuted}
            value={bikeModel}
            onChangeText={setBikeModel}
          />

          <Text style={styles.label}>Vehicle Number</Text>
          <TextInput
            style={styles.input}
            placeholder="E.g., KL 01 AB 1234"
            placeholderTextColor={Colors.textMuted}
            value={vehicleNumber}
            onChangeText={setVehicleNumber}
          />

          <Text style={styles.label}>Issue Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the issues reported by the customer"
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={issueDescription}
            onChangeText={setIssueDescription}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Creating...' : 'Create Job Card'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => navigation.goBack()}
            >
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (Colors: any) => StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 20,
  },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 8,
    marginTop: 12,
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
    marginBottom: 8,
  },
  textArea: {
    height: 120,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  button: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonSecondary: {
    backgroundColor: Colors.cardBgElevated,
    shadowColor: 'transparent',
    elevation: 0,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonTextSecondary: {
    color: Colors.textMuted,
  },
});
