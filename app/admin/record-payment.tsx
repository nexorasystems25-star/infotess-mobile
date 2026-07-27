import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Text,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { api, ApiError } from '@/services/api';
import { Field, PrimaryButton, GhostButton } from '@/components/ui';
import { useThemeContext } from '@/context/ThemeContext';

export default function RecordPayment() {
  const router = useRouter();
  const { theme } = useThemeContext();
  const [studentId, setStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [semester, setSemester] = useState('Semester 1');
  const [method, setMethod] = useState<'Cash' | 'Mobile Money' | 'Bank Transfer'>('Cash');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ receipt_url: string } | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  const methods: { key: typeof method; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'Mobile Money', label: 'MoMo', icon: 'phone-portrait' },
    { key: 'Bank Transfer', label: 'Bank', icon: 'business' },
    { key: 'Cash', label: 'Cash', icon: 'cash' },
  ];

  const submit = async () => {
    if (!studentId || !amount || Number(amount) <= 0) {
      Alert.alert('Missing fields', 'Enter student ID and a valid amount.');
      return;
    }
    if (method === 'Mobile Money' && !phoneNumber) {
      Alert.alert('Missing fields', 'Enter the payer phone number for Mobile Money.');
      return;
    }
    if (method === 'Bank Transfer' && !accountNumber) {
      Alert.alert('Missing fields', 'Enter the bank account number.');
      return;
    }
    setBusy(true);
    try {
      const r = await api.recordPayment({
        student_id: Number(studentId),
        amount: Number(amount),
        academic_year: academicYear,
        semester,
        payment_method: method,
        payment_date: date,
        phone_number: method === 'Mobile Money' ? phoneNumber : undefined,
        transaction_id: (method === 'Mobile Money' || method === 'Bank Transfer') ? transactionId : undefined,
        account_number: method === 'Bank Transfer' ? accountNumber : undefined,
      });
      setResult(r);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Payment recording failed');
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally { setBusy(false); }
  };

  if (result) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, padding: theme.spacing.xxl, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.xxl }}>
          <Ionicons name="checkmark-circle" size={44} color="#00140D" />
        </View>
        <Text style={theme.typography.h1}>Payment recorded</Text>
        <Text style={[theme.typography.body, { color: theme.colors.textDim, marginTop: theme.spacing.sm, textAlign: 'center' }]}>
          Receipt generated successfully. You can share the PDF now or view it later.
        </Text>
        <View style={{ marginTop: theme.spacing.xxl, width: '100%', gap: theme.spacing.md }}>
          <PrimaryButton title="View receipt" onPress={() => {}} icon="document-text" />
          <GhostButton title="Back to payments" onPress={() => router.back()} icon="arrow-back" />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.xxl, paddingTop: 60, paddingBottom: theme.spacing.huge * 2 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xxl }}>
          <Text style={theme.typography.h1}>Record payment</Text>
          <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: theme.colors.surface3, alignItems: 'center', justifyContent: 'center' }}
            onTouchEnd={() => router.back()}>
            <Ionicons name="close" size={20} color={theme.colors.textDim} />
          </View>
        </View>

        <Field label="Student ID" value={studentId} onChangeText={setStudentId} placeholder="e.g. 42" icon="person" keyboardType="numeric" />
        <Field label="Amount (GH₵)" value={amount} onChangeText={setAmount} placeholder="0.00" icon="cash" keyboardType="numeric" />

        <View style={{ marginBottom: theme.spacing.md }}>
          <Text style={[theme.typography.small, { color: theme.colors.textDim, marginBottom: theme.spacing.xs }]}>Payment method</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {methods.map((m) => (
              <View
                key={m.key}
                onTouchEnd={() => setMethod(m.key)}
                style={{
                  flex: 1, paddingVertical: 14, alignItems: 'center',
                  borderRadius: theme.radii.md, flexDirection: 'row', justifyContent: 'center', gap: 6,
                  backgroundColor: method === m.key ? theme.colors.primary : theme.colors.surface2,
                  borderWidth: 1, borderColor: method === m.key ? theme.colors.primary : theme.colors.hairline,
                }}
              >
                <Ionicons name={m.icon} size={16} color={method === m.key ? '#00140D' : theme.colors.textDim} />
                <Text style={{ fontWeight: '700', fontSize: 13, color: method === m.key ? '#00140D' : theme.colors.textDim }}>{m.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {method === 'Mobile Money' && (
          <>
            <Field label="Phone number" value={phoneNumber} onChangeText={setPhoneNumber} placeholder="e.g. 0241234567" icon="call" keyboardType="phone-pad" />
            <Field label="Transaction ID" value={transactionId} onChangeText={setTransactionId} placeholder="e.g. TXN-12345" icon="finger-print" autoCapitalize="none" />
          </>
        )}

        {method === 'Bank Transfer' && (
          <>
            <Field label="Account number" value={accountNumber} onChangeText={setAccountNumber} placeholder="e.g. 1234567890" icon="card" keyboardType="numeric" />
            <Field label="Transaction ID" value={transactionId} onChangeText={setTransactionId} placeholder="e.g. TXN-67890" icon="finger-print" autoCapitalize="none" />
          </>
        )}

        <Field label="Academic year" value={academicYear} onChangeText={setAcademicYear} placeholder="2025/2026" icon="school" />
        <Field label="Semester" value={semester} onChangeText={setSemester} placeholder="Semester 1" icon="calendar" />

        <Field label="Payment date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" icon="calendar-outline" />

        <PrimaryButton title="Record payment" onPress={submit} loading={busy} icon="checkmark-circle" />
        <View style={{ marginTop: theme.spacing.md }}>
          <GhostButton title="Cancel" onPress={() => router.back()} icon="arrow-back" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
