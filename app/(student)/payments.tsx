import { useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { api, ApiError } from '@/services/api';
import { Payment } from '@/types';
import { Card, SectionHeader, GhostButton } from '@/components/ui';
import { useThemeContext } from '@/context/ThemeContext';
import { ReceiptModal, ReceiptParams } from '@/components/ReceiptModal';

function fmtGHS(n: number | string) { return `GH₵ ${Number(n || 0).toFixed(2)}`; }

export default function StudentPayments() {
  const { theme } = useThemeContext();
  const [items, setItems] = useState<Payment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [receiptParams, setReceiptParams] = useState<ReceiptParams | null>(null);

  const load = async () => {
    setRefreshing(true);
    try { const r = await api.myPayments(); setItems(r.payments); setError(null); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Load failed'); }
    finally { setRefreshing(false); setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleReceipt = async (paymentId: number) => {
    setDownloadingId(paymentId);
    try {
      const r = await api.getReceipt(paymentId, 'student');
      const rc = r.receipt;
      setReceiptParams({
        receipt_number: rc.receipt_number,
        payment_date: rc.payment_date,
        payment_method: rc.payment_method,
        amount: String(rc.amount),
        academic_year: rc.academic_year,
        semester: rc.semester,
        full_name: rc.full_name,
        index_number: rc.index_number,
        department: rc.department,
        level: rc.level,
        total_paid: String(rc.total_paid),
        required: String(rc.required),
      });
      setReceiptVisible(true);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load receipt');
    } finally { setDownloadingId(null); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, padding: theme.spacing.xxl }}>
      <View style={{ marginBottom: theme.spacing.xxl }}>
        <Text style={theme.typography.h1}>My Payments</Text>
        <Text style={[theme.typography.body, { color: theme.colors.textDim, marginTop: 4 }]}>
          {items.length} payment{items.length === 1 ? '' : 's'} recorded
        </Text>
      </View>

      {error ? <Text style={{ color: theme.colors.danger, textAlign: 'center', marginTop: theme.spacing.xxl }}>{error}</Text> : null}

      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={theme.colors.primary} />}
        contentContainerStyle={{ paddingBottom: theme.spacing.xxxl }}
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
        ListEmptyComponent={
          !loading ? (
            <View style={{ marginTop: 60, alignItems: 'center' }}>
              <Ionicons name="receipt-outline" size={48} color={theme.colors.textMuted} />
              <Text style={{ color: theme.colors.textDim, marginTop: 12, fontSize: 15 }}>No payments yet.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Card elevation="soft">
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.sm, alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={[theme.typography.bodyMedium, { color: theme.colors.text }]}>{fmtGHS(item.amount)}</Text>
                <Text style={[theme.typography.small, { color: theme.colors.textDim, marginTop: 2 }]}>{item.payment_method} · {item.payment_date}</Text>
              </View>
              <Text style={[theme.typography.mono, { color: theme.colors.secondary }]}>{item.receipt_number}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: theme.spacing.sm, borderTopWidth: 1, borderTopColor: theme.colors.hairline, paddingTop: theme.spacing.sm }}>
              <GhostButton
                title={downloadingId === item.id ? 'Opening...' : 'Receipt'}
                onPress={() => handleReceipt(item.id)}
                icon="document-text-outline"
              />
            </View>
          </Card>
        )}
      />
      <ReceiptModal
        visible={receiptVisible}
        onClose={() => setReceiptVisible(false)}
        params={receiptParams || { receipt_number: '', payment_date: '', payment_method: '', amount: '0', academic_year: '', semester: '', full_name: '', index_number: '', department: '', level: '', total_paid: '0', required: '0' }}
        isDark={theme.isDark}
      />
    </View>
  );
}
