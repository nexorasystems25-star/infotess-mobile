import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, View, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { api, ApiError } from '@/services/api';
import { Payment } from '@/types';
import { Card } from '@/components/ui';
import { useThemeContext } from '@/context/ThemeContext';

export default function StudentReceipts() {
  const { theme } = useThemeContext();
  const [items, setItems] = useState<Payment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setRefreshing(true);
    try { const r = await api.myPayments(); setItems(r.payments); setError(null); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Load failed'); }
    finally { setRefreshing(false); }
  };
  useEffect(() => { load(); }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, padding: theme.spacing.xxl }}>
      <View style={{ marginBottom: theme.spacing.xxl }}>
        <Text style={theme.typography.h1}>My Receipts</Text>
        <Text style={[theme.typography.body, { color: theme.colors.textDim, marginTop: 4 }]}>Tap a receipt to open the PDF.</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={theme.colors.primary} />}
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
        ListEmptyComponent={
          <View style={{ marginTop: 60, alignItems: 'center' }}>
            <Ionicons name="document-text-outline" size={48} color={theme.colors.textMuted} />
            <Text style={{ color: theme.colors.textDim, marginTop: 12, fontSize: 15 }}>No receipts yet.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: theme.colors.surface3, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="document-text" size={22} color={theme.colors.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[theme.typography.bodyMedium, { color: theme.colors.text }]}>{item.receipt_number}</Text>
                <Text style={[theme.typography.small, { color: theme.colors.textDim }]}>GH₵ {Number(item.amount).toFixed(2)} · {item.payment_date}</Text>
              </View>
              <Ionicons name="open-outline" size={20} color={theme.colors.primary} />
            </View>
          </Card>
        )}
      />
    </View>
  );
}
