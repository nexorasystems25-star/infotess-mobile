import { useEffect, useState, useCallback } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';

import { api, ApiError } from '@/services/api';
import { PaymentProof } from '@/types';
import { Card, Badge } from '@/components/ui';
import { useThemeContext } from '@/context/ThemeContext';

const STATUS_FILTERS = ['pending', 'approved', 'rejected'] as const;

export default function AdminProofs() {
  const { theme } = useThemeContext();
  const router = useRouter();
  const [items, setItems] = useState<PaymentProof[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [filter, setFilter] = useState<string>('pending');
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (p = page, statusFilter = filter) => {
    setRefreshing(true);
    try {
      const r = await api.adminProofs(statusFilter, p);
      setItems(r.proofs);
      setPendingCount(r.pending_count);
      setTotalPages(r.total_pages);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Load failed');
    } finally {
      setRefreshing(false);
    }
  }, [page, filter]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const switchFilter = (f: string) => { setFilter(f); setPage(1); load(1, f); };

  const statusBadge: Record<string, { label: string; tone: 'primary' | 'danger' | 'accent' | 'muted' }> = {
    pending: { label: 'Pending', tone: 'accent' },
    approved: { label: 'Approved', tone: 'primary' },
    rejected: { label: 'Rejected', tone: 'danger' },
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, padding: theme.spacing.xxl }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.xxl }}>
        <View>
          <Text style={theme.typography.h1}>Payment Proofs</Text>
          <Text style={[theme.typography.small, { color: theme.colors.textDim, marginTop: 2 }]}>
            {pendingCount > 0 ? `${pendingCount} pending review` : 'All caught up'}
          </Text>
        </View>
        {pendingCount > 0 && (
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.danger, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>{pendingCount}</Text>
          </View>
        )}
      </View>

      {/* Filter tabs */}
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.xxl }}>
        {STATUS_FILTERS.map((f) => {
          const active = filter === f;
          return (
            <Pressable key={f} onPress={() => switchFilter(f)}>
              <View style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: theme.radii.md,
                borderWidth: 1.5,
                borderColor: active ? theme.colors.primary : theme.colors.hairline,
                backgroundColor: active ? `${theme.colors.primary}15` : 'transparent',
              }}>
                <Text style={{ color: active ? theme.colors.primary : theme.colors.textDim, fontSize: 13, fontWeight: active ? '700' : '500', textTransform: 'capitalize' }}>
                  {f}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <Text style={{ color: theme.colors.danger, textAlign: 'center', marginTop: theme.spacing.xxl }}>{error}</Text>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load()} tintColor={theme.colors.primary} />}
        contentContainerStyle={{ paddingBottom: theme.spacing.xxxl }}
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
        ListEmptyComponent={
          <View style={{ marginTop: 60, alignItems: 'center' }}>
            <Ionicons name="checkmark-done-circle-outline" size={48} color={theme.colors.textMuted} />
            <Text style={{ color: theme.colors.textDim, marginTop: 12, fontSize: 15 }}>
              {filter === 'pending' ? 'No pending proofs.' : `No ${filter} proofs.`}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const badge = statusBadge[item.status] || statusBadge.pending;
          return (
            <Pressable onPress={() => router.push({ pathname: '/(admin)/proof-detail', params: { id: String(item.id) } })}>
              <Card>
                {/* Top row: student name + badge */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[theme.typography.bodyMedium, { color: theme.colors.text, fontWeight: '600' }]}>
                      {item.students?.full_name || `Student #${item.student_id}`}
                    </Text>
                    <Text style={[theme.typography.small, { color: theme.colors.textDim, marginTop: 1 }]}>
                      {item.students?.index_number || '—'} · {item.students?.department || ''}
                    </Text>
                  </View>
                  <Badge label={badge.label} tone={badge.tone} />
                </View>

                {/* Amount + method */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: theme.colors.surface3, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name={item.payment_method === 'Mobile Money' ? 'phone-portrait' : 'business'} size={16} color={theme.colors.secondary} />
                    </View>
                    <Text style={[theme.typography.small, { color: theme.colors.textDim }]}>{item.payment_method}</Text>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: theme.colors.primary }}>GH₵ {Number(item.amount).toFixed(2)}</Text>
                </View>

                {/* Reference + date */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[theme.typography.small, { color: theme.colors.textMuted }]}>
                    {item.reference_number ? `Ref: ${item.reference_number}` : 'No reference'}
                  </Text>
                  <Text style={[theme.typography.small, { color: theme.colors.textMuted }]}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                </View>

                {/* Arrow */}
                {item.status === 'pending' && (
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
                    <Text style={[theme.typography.small, { color: theme.colors.primary, fontWeight: '600' }]}>Tap to review →</Text>
                  </View>
                )}
              </Card>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
