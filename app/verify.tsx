import { useState } from 'react';
import { Alert, FlatList, Keyboard, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { api } from '@/services/api';
import { VerifyResult } from '@/types';
import { Card, Field, PrimaryButton, SectionHeader, Badge } from '@/components/ui';
import { useThemeContext } from '@/context/ThemeContext';
import { Text } from 'react-native';

export default function Verify() {
  const router = useRouter();
  const { theme } = useThemeContext();
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);

  const run = async () => {
    if (!q.trim()) return Alert.alert('Enter receipt number');
    setBusy(true); setResult(null);
    try {
      const r = await api.verifyReceipt(q.trim());
      setResult(r.result);
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setBusy(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, padding: theme.spacing.xxl }}>
      <Text style={theme.typography.h1}>Verify a receipt</Text>
      <Text style={[theme.typography.body, { color: theme.colors.textDim, marginTop: theme.spacing.sm, marginBottom: theme.spacing.xxl }]}>
        Enter the receipt number printed on the INFOTESS receipt to confirm authenticity.
      </Text>

      <Field label="Receipt Number" value={q} onChangeText={setQ} placeholder="e.g. RCP-2026-0123" icon="receipt" autoCapitalize="none" />
      <PrimaryButton title="Verify" onPress={run} loading={busy} icon="shield-checkmark" />

      {result ? (
        <View style={{ marginTop: theme.spacing.xxl }}>
          <SectionHeader title="Result" />
          <Card>
            <Badge label={result.valid ? 'Authentic' : 'Invalid'} tone={result.valid ? 'primary' : 'danger'} />
            {result.valid && result.receipt ? (
              <View style={{ marginTop: theme.spacing.md, gap: 6 }}>
                <Row label="Receipt Number" value={result.receipt.receipt_number} theme={theme} />
                <Row label="Student" value={result.receipt.student?.full_name || '—'} theme={theme} />
                <Row label="Index" value={result.receipt.student?.index_number || '—'} theme={theme} />
                <Row label="Amount" value={`GH₵ ${Number(result.receipt.amount).toFixed(2)}`} theme={theme} />
                <Row label="Method" value={result.receipt.payment_method} theme={theme} />
                <Row label="Date" value={result.receipt.payment_date} theme={theme} />
                <Row label="Year/Sem" value={`${result.receipt.academic_year} · ${result.receipt.semester}`} theme={theme} />
              </View>
            ) : (
              <Text style={[theme.typography.body, { color: theme.colors.danger, marginTop: theme.spacing.md }]}>
                {result.reason || 'Receipt not found in our records.'}
              </Text>
            )}
          </Card>
        </View>
      ) : null}
    </View>
  );
}

function Row({ label, value, theme }: { label: string; value: string; theme: any }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 }}>
      <Text style={[theme.typography.small, { color: theme.colors.textDim }]}>{label}</Text>
      <Text style={[theme.typography.bodyMedium, { color: theme.colors.text }]}>{value}</Text>
    </View>
  );
}
