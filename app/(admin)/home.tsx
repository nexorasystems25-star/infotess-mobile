import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { api, ApiError } from '@/services/api';
import { DashboardStats } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useThemeContext } from '@/context/ThemeContext';
import { Card, SectionHeader, Stat, Badge, PrimaryButton } from '@/components/ui';

function fmtGHS(n: number | string) {
  const v = Number(n || 0);
  if (v >= 1000) return `GH₵ ${(v / 1000).toFixed(1)}k`;
  return `GH₵ ${v.toFixed(0)}`;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme } = useThemeContext();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    try {
      const r = await api.dashboard();
      setStats(r.stats);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load dashboard');
    } finally { setRefreshing(false); setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const recentPayments = stats?.recent_payments?.slice(0, 5) ?? [];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ padding: theme.spacing.xxl, paddingBottom: theme.spacing.huge * 2 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={theme.colors.primary} />}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.xxl }}>
        <View>
          <Text style={[theme.typography.small, { color: theme.colors.textDim }]}>Admin Dashboard</Text>
          <Text style={theme.typography.h1}>{user ? (user.email.split('@')[0] || 'Admin') : 'Admin'}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: theme.colors.surface3, alignItems: 'center', justifyContent: 'center' }}
            onTouchEnd={() => router.push('/admin/scan')}>
            <Ionicons name="qr-code" size={20} color={theme.colors.secondary} />
          </View>
          <Text style={[theme.typography.small, { color: theme.colors.danger }]} onPress={() => logout()}>Sign out</Text>
        </View>
      </View>

      {error ? (
        <Card style={{ marginBottom: theme.spacing.lg, borderColor: theme.colors.danger }}>
          <Text style={{ color: theme.colors.danger }}>{error}</Text>
        </Card>
      ) : null}

      {/* Hero collection card */}
      <Card style={{ marginBottom: theme.spacing.xxl }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[theme.typography.small, { color: theme.colors.textDim, letterSpacing: 1, textTransform: 'uppercase' }]}>
            Total Revenue
          </Text>
          <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: theme.colors.primary }} />
        </View>
        <Text style={[theme.typography.display, { color: theme.colors.text, marginTop: theme.spacing.md }]}>
          {fmtGHS(stats?.total_revenue ?? 0)}
        </Text>
        <View style={{ flexDirection: 'row', gap: theme.spacing.xxl, marginTop: theme.spacing.md }}>
          <View>
            <Text style={[theme.typography.small, { color: theme.colors.textMuted }]}>COMPLIANCE</Text>
            <Text style={[theme.typography.h3, { color: theme.colors.accent }]}>{stats?.compliance_rate ?? 0}%</Text>
          </View>
          <View>
            <Text style={[theme.typography.small, { color: theme.colors.textMuted }]}>TOTAL PAYMENTS</Text>
            <Text style={[theme.typography.h3, { color: theme.colors.primary }]}>{stats?.total_payments ?? 0}</Text>
          </View>
        </View>
      </Card>

      {/* Stats grid */}
      <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.xxl }}>
        <Stat label="Students" value={String(stats?.total_students ?? '—')} icon="people" tone="secondary" />
        <Stat label="Compliance" value={`${stats?.compliance_rate ?? 0}%`} icon="checkmark-circle" tone="primary" />
      </View>

      {/* Quick actions */}
      <SectionHeader title="Quick actions" />
      <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.xxl }}>
        <View style={{ flex: 1 }}>
          <PrimaryButton title="Record" onPress={() => router.push('/admin/record-payment')} icon="add-circle" />
        </View>
        <View style={{ flex: 1 }}>
          <PrimaryButton title="New Student" onPress={() => router.push('/admin/add-student')} icon="person-add" />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.xxl }}>
        <View style={{ flex: 1 }}>
          <PrimaryButton title="Students" onPress={() => router.push('/(admin)/students')} icon="people" />
        </View>
      </View>

      {/* Recent payments */}
      <SectionHeader title="Recent payments" action={`${stats?.recent_payments?.length ?? 0} total`} />
      {recentPayments.length === 0 && !loading ? (
        <Card>
          <Text style={[theme.typography.body, { color: theme.colors.textDim }]}>No payments recorded yet.</Text>
        </Card>
      ) : null}

      {recentPayments.map((p) => (
        <Card key={p.id} elevation="soft" style={{ marginBottom: theme.spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={[theme.typography.bodyMedium, { color: theme.colors.text }]}>{(p as any).full_name ?? p.student?.full_name ?? '—'}</Text>
              <Text style={[theme.typography.small, { color: theme.colors.textDim, marginTop: 2 }]}>
                {(p as any).index_number ?? p.student?.index_number} · {p.payment_method}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[theme.typography.h3, { color: theme.colors.primary }]}>GH₵ {Number(p.amount).toFixed(2)}</Text>
              <Badge label={`${p.academic_year} · ${p.semester}`} tone="muted" />
            </View>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}
