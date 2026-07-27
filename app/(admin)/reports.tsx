import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { api, ApiError } from '@/services/api';
import { Card, SectionHeader, Badge } from '@/components/ui';
import { useThemeContext } from '@/context/ThemeContext';

type ReportType = 'compliance' | 'defaulters' | 'financial';

export default function AdminReports() {
  const { theme } = useThemeContext();
  const [tab, setTab] = useState<ReportType>('compliance');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (t?: ReportType) => {
    const type = t ?? tab;
    setRefreshing(true);
    try {
      let r;
      if (type === 'compliance') r = await api.reportCompliance();
      else if (type === 'defaulters') r = await api.reportDefaulters();
      else r = await api.reportFinancial();
      setData(r.rows);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load report');
    } finally { setRefreshing(false); setLoading(false); }
  };

  useFocusEffect(
    useCallback(() => {
      load(tab);
      setLoading(true);
    }, [tab])
  );

  const tabs: { key: ReportType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'compliance', label: 'Compliance', icon: 'checkmark-done' },
    { key: 'defaulters', label: 'Defaulters', icon: 'alert-circle' },
    { key: 'financial', label: 'Financial', icon: 'wallet' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View style={{ padding: theme.spacing.xxl, paddingBottom: theme.spacing.md }}>
        <Text style={theme.typography.h1}>Reports</Text>
        <Text style={[theme.typography.body, { color: theme.colors.textDim, marginTop: 4 }]}>Analytics and compliance overview</Text>
      </View>

      {/* Tab bar */}
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: theme.spacing.xxl, marginBottom: theme.spacing.xl }}>
        {tabs.map((t) => (
          <View
            key={t.key}
            onTouchEnd={() => { setTab(t.key); setLoading(true); }}
            style={{
              flex: 1, paddingVertical: 10, alignItems: 'center',
              borderRadius: theme.radii.pill,
              backgroundColor: tab === t.key ? theme.colors.primary : theme.colors.surface2,
              borderWidth: 1, borderColor: tab === t.key ? theme.colors.primary : theme.colors.hairline,
            }}
          >
            <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
              <Ionicons name={t.icon} size={14} color={tab === t.key ? '#00140D' : theme.colors.textDim} />
              <Text style={{ fontWeight: '700', fontSize: 13, color: tab === t.key ? '#00140D' : theme.colors.textDim }}>{t.label}</Text>
            </View>
          </View>
        ))}
      </View>

      {error ? (
        <View style={{ paddingHorizontal: theme.spacing.xxl }}>
          <Card style={{ borderColor: theme.colors.danger }}><Text style={{ color: theme.colors.danger }}>{error}</Text></Card>
        </View>
      ) : null}

      <FlatList
        data={data}
        keyExtractor={(_, i) => String(i)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load()} tintColor={theme.colors.primary} />}
        contentContainerStyle={{ padding: theme.spacing.xxl, paddingBottom: theme.spacing.huge * 2 }}
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
        ListHeaderComponent={<SectionHeader title={`${tabs.find(t => t.key === tab)?.label} Report`} action={`${data.length} entries`} />}
        ListEmptyComponent={
          !loading && !error ? (
            <Card>
              <Text style={[theme.typography.body, { color: theme.colors.textDim }]}>No data for this report yet.</Text>
            </Card>
          ) : null
        }
        renderItem={({ item, index }) => {
          if (tab === 'compliance') return <ComplianceRow item={item} index={index} theme={theme} />;
          if (tab === 'defaulters') return <DefaulterRow item={item} index={index} theme={theme} />;
          return <FinancialRow item={item} index={index} theme={theme} />;
        }}
      />
    </View>
  );
}

function ComplianceRow({ item, index, theme }: { item: any; index: number; theme: any }) {
  const isPaid = item.status === 'Paid';
  return (
    <Card elevation="soft">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{
          width: 36, height: 36, borderRadius: 10,
          backgroundColor: isPaid ? `${theme.colors.primary}1A` : `${theme.colors.danger}1A`,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name={isPaid ? 'checkmark-circle' : 'alert-circle'} size={18} color={isPaid ? theme.colors.primary : theme.colors.danger} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[theme.typography.bodyMedium, { color: theme.colors.text }]}>{item.full_name}</Text>
          <Text style={[theme.typography.small, { color: theme.colors.textDim, marginTop: 2 }]}>
            {item.index_number} · {item.department} — Lvl {item.level}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Badge label={item.status} tone={isPaid ? 'primary' : 'danger'} />
          <Text style={[theme.typography.small, { color: theme.colors.textMuted, marginTop: 4 }]}>
            GH₵ {Number(item.total_paid).toFixed(0)} / {Number(item.required).toFixed(0)}
          </Text>
        </View>
      </View>
    </Card>
  );
}

function DefaulterRow({ item, index, theme }: { item: any; index: number; theme: any }) {
  return (
    <Card elevation="soft">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{
          width: 36, height: 36, borderRadius: 10,
          backgroundColor: `${theme.colors.danger}1A`,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={[theme.typography.bodyMedium, { color: theme.colors.danger }]}>{index + 1}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[theme.typography.bodyMedium, { color: theme.colors.text }]}>{item.full_name}</Text>
          <Text style={[theme.typography.small, { color: theme.colors.textDim, marginTop: 2 }]}>
            {item.index_number} · {item.department} — Lvl {item.level}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[theme.typography.h3, { color: theme.colors.danger }]}>GH₵ {Number(item.balance).toFixed(0)}</Text>
          <Text style={[theme.typography.small, { color: theme.colors.textMuted }]}>
            Paid GH₵ {Number(item.total_paid).toFixed(0)}
          </Text>
        </View>
      </View>
    </Card>
  );
}

function FinancialRow({ item, index, theme }: { item: any; index: number; theme: any }) {
  const methodIcon: Record<string, keyof typeof Ionicons.glyphMap> = {
    'Mobile Money': 'phone-portrait',
    'Bank Transfer': 'business',
    'Cash': 'cash',
  };
  return (
    <Card elevation="soft">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{
          width: 36, height: 36, borderRadius: 10,
          backgroundColor: `${theme.colors.primary}1A`,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name={methodIcon[item.payment_method] ?? 'wallet'} size={18} color={theme.colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[theme.typography.bodyMedium, { color: theme.colors.text }]}>{item.payment_method}</Text>
          <Text style={[theme.typography.small, { color: theme.colors.textDim, marginTop: 2 }]}>
            {item.count} payment{item.count === 1 ? '' : 's'}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[theme.typography.h3, { color: theme.colors.primary }]}>GH₵ {Number(item.total).toFixed(0)}</Text>
        </View>
      </View>
    </Card>
  );
}
