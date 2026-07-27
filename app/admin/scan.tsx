import { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { api } from '@/services/api';
import { VerifyResult } from '@/types';
import { Card, Badge, Field, PrimaryButton, GhostButton } from '@/components/ui';
import { useThemeContext } from '@/context/ThemeContext';

export default function AdminScan() {
  const router = useRouter();
  const { theme } = useThemeContext();
  const [receiptNo, setReceiptNo] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);

  const verify = async () => {
    if (!receiptNo.trim()) return Alert.alert('Enter a receipt number');
    setBusy(true); setResult(null);
    try {
      const r = await api.verifyReceipt(receiptNo.trim());
      setResult(r.result);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setBusy(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, padding: theme.spacing.xxl, paddingTop: 60 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xxl }}>
        <Text style={theme.typography.h1}>Verify receipt</Text>
        <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: theme.colors.surface3, alignItems: 'center', justifyContent: 'center' }}
          onTouchEnd={() => router.back()}>
          <Ionicons name="close" size={20} color={theme.colors.textDim} />
        </View>
      </View>

      <Text style={[theme.typography.body, { color: theme.colors.textDim, marginBottom: theme.spacing.xxl }]}>
        Scan or type the receipt number to verify authenticity.
      </Text>

      <Field label="Receipt Number" value={receiptNo} onChangeText={setReceiptNo} placeholder="RCP-2026-XXXX" icon="receipt" autoCapitalize="none" />
      <PrimaryButton title="Verify" onPress={verify} loading={busy} icon="shield-checkmark" />

      {result ? (
        <View style={{ marginTop: theme.spacing.xxl }}>
          <Card>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: result.valid ? 0 : 0 }}>
              <View style={{
                width: 48, height: 48, borderRadius: 14,
                backgroundColor: result.valid ? theme.colors.primarySoft : `${theme.colors.danger}1A`,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name={result.valid ? 'checkmark-circle' : 'close-circle'} size={26}
                  color={result.valid ? theme.colors.primary : theme.colors.danger} />
              </View>
              <View>
                <Badge label={result.valid ? 'Authentic' : 'Invalid / Not found'} tone={result.valid ? 'primary' : 'danger'} />
              </View>
            </View>

            {result.valid && result.receipt ? (
              <View style={{ marginTop: theme.spacing.lg, gap: 6 }}>
                <Row label="Receipt #" value={result.receipt.receipt_number} theme={theme} />
                <Row label="Student" value={result.receipt.student?.full_name ?? '—'} theme={theme} />
                <Row label="Index" value={result.receipt.student?.index_number ?? '—'} theme={theme} />
                <Row label="Amount" value={`GH₵ ${Number(result.receipt.amount).toFixed(2)}`} theme={theme} />
                <Row label="Method" value={result.receipt.payment_method} theme={theme} />
                <Row label="Date" value={result.receipt.payment_date} theme={theme} />
                <Row label="Year / Semester" value={`${result.receipt.academic_year} · ${result.receipt.semester}`} theme={theme} />
              </View>
            ) : (
              <Text style={[theme.typography.body, { color: theme.colors.danger, marginTop: theme.spacing.md }]}>
                {result.reason || 'Receipt not found in our records.'}
              </Text>
            )}
          </Card>
        </View>
      ) : null}

      <View style={{ marginTop: theme.spacing.xxl }}>
        <GhostButton title="Back to dashboard" onPress={() => router.back()} icon="arrow-back" />
      </View>
    </View>
  );
}

function Row({ label, value, theme }: { label: string; value: string; theme: any }) {
  return (
    <View style={{ paddingVertical: 8, borderTopColor: theme.colors.hairline, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={[theme.typography.small, { color: theme.colors.textDim }]}>{label}</Text>
      <Text style={[theme.typography.bodyMedium, { color: theme.colors.text }]}>{value}</Text>
    </View>
  );
}
