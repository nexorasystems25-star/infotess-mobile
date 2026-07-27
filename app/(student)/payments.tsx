import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { api, ApiError } from '@/services/api';
import { Payment } from '@/types';
import { Card, SectionHeader, Badge } from '@/components/ui';
import { useThemeContext } from '@/context/ThemeContext';

function fmtGHS(n: number | string) { return `GH₵ ${Number(n || 0).toFixed(2)}`; }

export default function StudentPayments() {
  const { theme } = useThemeContext();
  const [items, setItems] = useState<Payment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setRefreshing(true);
    try { const r = await api.myPayments(); setItems(r.payments); setError(null); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Load failed'); }
    finally { setRefreshing(false); setLoading(false); }
  };
  useEffect(() => { load(); }, []);

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
              <Badge label={`${item.academic_year} — ${item.semester}`} tone="muted" />
            </View>
            <View style={{ paddingTop: theme.spacing.sm, borderTopColor: theme.colors.hairline, borderTopWidth: 1, marginTop: theme.spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[theme.typography.small, { color: theme.colors.textMuted }]}>Receipt #</Text>
              <Text style={[theme.typography.mono, { color: theme.colors.secondary }]}>{item.receipt_number}</Text>
            </View>
          </Card>
        )}
      />
    </View>
  );
}
