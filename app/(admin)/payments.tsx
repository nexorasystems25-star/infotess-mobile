import { useState, useCallback } from 'react';
import { FlatList, View, Text, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { api, ApiError } from '@/services/api';
import { Payment } from '@/types';
import { Card, Badge, SectionHeader, PrimaryButton, GhostButton } from '@/components/ui';
import { useThemeContext } from '@/context/ThemeContext';

interface MethodSummary {
  method: string;
  count: number;
  amount: number;
}

export default function AdminPayments() {
  const router = useRouter();
  const { theme } = useThemeContext();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [byMethod, setByMethod] = useState<MethodSummary[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (p?: number) => {
    const pageNum = p !== undefined ? p : page;
    setRefreshing(true);
    try {
      const r = await api.adminPayments(pageNum);
      setPayments(r.payments);
      setByMethod(r.by_method);
      setTotal(r.total);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load payments');
    } finally { setRefreshing(false); setLoading(false); }
  };

  useFocusEffect(
    useCallback(() => {
      load(1);
      setPage(1);
    }, [])
  );

  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const handleReceipt = async (paymentId: number) => {
    setDownloadingId(paymentId);
    try {
      const r = await api.getReceipt(paymentId, 'admin');
      const rc = r.receipt;
      router.push({
        pathname: '/admin/receipt',
        params: {
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
        },
      });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load receipt');
    } finally { setDownloadingId(null); }
  };

  const methodIcon: Record<string, keyof typeof Ionicons.glyphMap> = {
    'Mobile Money': 'phone-portrait',
    'Bank Transfer': 'business',
    'Cash': 'cash',
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      {/* Header */}
      <View style={{ padding: theme.spacing.xxl, paddingBottom: theme.spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View>
          <Text style={theme.typography.h1}>Payments</Text>
          <Text style={[theme.typography.body, { color: theme.colors.textDim, marginTop: 4 }]}>
            {total} total payment{total === 1 ? '' : 's'}
          </Text>
        </View>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: theme.colors.primary, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 4 }}
          onTouchEnd={() => router.push('/admin/record-payment')}>
          <Ionicons name="add" size={24} color="#00140D" />
        </View>
      </View>

      <FlatList
        data={payments}
        keyExtractor={(i) => String(i.id ?? i.payment_id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load()} tintColor={theme.colors.primary} />}
        contentContainerStyle={{ padding: theme.spacing.xxl, paddingBottom: theme.spacing.huge * 2 }}
        ListHeaderComponent={
          <>
            {/* By method summary */}
            {byMethod.length > 0 ? (
              <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.xxl }}>
                {byMethod.map((m) => (
                  <Card key={m.method} elevation="soft" style={{ flex: 1, minHeight: 90 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name={methodIcon[m.method] ?? 'wallet'} size={14} color={theme.colors.textDim} />
                      <Text style={[theme.typography.small, { color: theme.colors.textDim }]}>{m.method}</Text>
                    </View>
                    <Text style={[theme.typography.h2, { color: theme.colors.text, marginTop: 4 }]}>GH₵ {Number(m.amount).toFixed(0)}</Text>
                    <Text style={[theme.typography.small, { color: theme.colors.textMuted }]}>{m.count} payment{m.count === 1 ? '' : 's'}</Text>
                  </Card>
                ))}
              </View>
            ) : null}
            <SectionHeader title="Recent payments" action={`${payments.length} shown`} />
          </>
        }
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
        ListEmptyComponent={
          !loading ? (
            <View style={{ marginTop: 40, alignItems: 'center' }}>
              <Ionicons name="cash-outline" size={48} color={theme.colors.textMuted} />
              <Text style={{ color: theme.colors.textDim, marginTop: 12, fontSize: 15 }}>No payments recorded yet.</Text>
              <PrimaryButton title="Record a payment" onPress={() => router.push('/admin/record-payment')} icon="add-circle" />
            </View>
          ) : null
        }
        ListFooterComponent={
          total > 20 ? (
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: theme.spacing.md, marginTop: theme.spacing.xl }}>
              <GhostButton title="← Previous" onPress={() => { if (page > 1) { setPage(page - 1); load(page - 1); } }} />
              <Text style={{ color: theme.colors.textDim, alignSelf: 'center', fontSize: 14 }}>Page {page}</Text>
              <GhostButton title="Next →" onPress={() => { setPage(page + 1); load(page + 1); }} />
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Card elevation="soft">
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={[theme.typography.bodyMedium, { color: theme.colors.text }]}>{(item as any).full_name ?? item.student?.full_name ?? '—'}</Text>
                <Text style={[theme.typography.small, { color: theme.colors.textDim, marginTop: 2 }]}>
                  {(item as any).index_number ?? item.student?.index_number} · {item.payment_method} · {item.payment_date}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[theme.typography.h3, { color: theme.colors.primary }]}>GH₵ {Number(item.amount).toFixed(2)}</Text>
                <Badge label={`${item.academic_year} · ${item.semester}`} tone="muted" />
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: theme.spacing.sm, borderTopWidth: 1, borderTopColor: theme.colors.hairline, paddingTop: theme.spacing.sm }}>
              <GhostButton
                title={downloadingId === (item.id ?? item.payment_id) ? 'Opening...' : 'Receipt'}
                onPress={() => handleReceipt(item.id ?? item.payment_id)}
                icon="document-text-outline"
              />
            </View>
          </Card>
        )}
      />
    </View>
  );
}
