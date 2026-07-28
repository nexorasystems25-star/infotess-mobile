import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Text } from 'react-native';

import { api, ApiError } from '@/services/api';
import { StudentDues } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useThemeContext } from '@/context/ThemeContext';
import { Badge, Card, PrimaryButton, Stat } from '@/components/ui';
import { useRouter } from 'expo-router';

export default function StudentHome() {
  const router = useRouter();
  const { user, student, logout } = useAuth();
  const { theme } = useThemeContext();
  const [dues, setDues] = useState<StudentDues | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    try {
      const r = await api.myDues();
      setDues(r.dues);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load dues');
    } finally { setRefreshing(false); setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const status = dues?.status ?? 'unpaid';
  const toneFor: Record<typeof status, 'primary' | 'accent' | 'danger'> = {
    paid: 'primary', partially_paid: 'accent', unpaid: 'danger',
  };

  const pct = dues && dues.total_due > 0 ? Math.min(100, (dues.total_paid / dues.total_due) * 100) : 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ padding: theme.spacing.xxl, paddingBottom: theme.spacing.huge * 2 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={theme.colors.primary} />}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.xxl }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: theme.colors.surface3, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="person" size={22} color={theme.colors.primary} />
          </View>
          <View>
            <Text style={[theme.typography.small, { color: theme.colors.textDim }]}>Welcome back</Text>
            <Text style={[theme.typography.h3]}>{student ? student.full_name : 'Student'}</Text>
          </View>
        </View>
        <Text style={[theme.typography.small, { color: theme.colors.danger }]} onPress={() => logout()}>Sign out</Text>
      </View>

      {/* Hero dues card */}
      <LinearGradient colors={[theme.colors.primary, '#00B589']} start={[0, 0]} end={[1, 1]} style={{
        borderRadius: theme.radii.xl, padding: theme.spacing.xxl, marginBottom: theme.spacing.xxl,
        shadowColor: theme.colors.primary, shadowOpacity: 0.3, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 8,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: '#00140D', fontSize: 13, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>
            Dues Status
          </Text>
          <Ionicons name="checkmark-circle" size={20} color="#00140D" />
        </View>
        <Text style={{ color: '#00140D', fontSize: 44, fontWeight: '800', marginTop: theme.spacing.md, letterSpacing: -1 }}>
          GH₵ {dues ? Number(dues.outstanding).toFixed(2) : '—'}
        </Text>
        <Text style={{ color: '#00140D90', fontSize: 14, marginBottom: theme.spacing.xxl, fontWeight: '500' }}>
          {status === 'paid' ? 'You are fully paid! 🎉' : 'Outstanding balance'}
        </Text>

        <View style={{ height: 6, backgroundColor: '#00140D40', borderRadius: theme.radii.pill, marginBottom: theme.spacing.md }}>
          <View style={{ height: 6, width: `${pct}%`, backgroundColor: '#00140D', borderRadius: theme.radii.pill }} />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ color: '#00140D80', fontSize: 11, fontWeight: '600' }}>PAID</Text>
            <Text style={{ color: '#00140D', fontSize: 16, fontWeight: '700' }}>GH₵ {dues ? Number(dues.total_paid).toFixed(2) : '...'}</Text>
          </View>
          <View>
            <Text style={{ color: '#00140D80', fontSize: 11, fontWeight: '600' }}>TOTAL DUE</Text>
            <Text style={{ color: '#00140D', fontSize: 16, fontWeight: '700' }}>GH₵ {dues ? Number(dues.total_due).toFixed(2) : '...'}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Semester info */}
      <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.xxl }}>
        <Stat label="Semester" value={dues?.semester ?? '—'} icon="calendar" tone="secondary" />
        <Stat label="Academic Year" value={dues?.academic_year ?? '—'} icon="school" tone="accent" />
      </View>

      {/* Bank details / instructions card */}
      <Card style={{ marginBottom: theme.spacing.xxl }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: theme.spacing.md }}>
          <Ionicons name="information-circle" size={20} color={theme.colors.secondary} />
          <Text style={theme.typography.h3}>How to pay</Text>
        </View>
        <Text style={[theme.typography.body, { color: theme.colors.textDim }]}>
          Make payment via Mobile Money, Bank Transfer/Deposit and submit proof via the app or pay at the INFOTESS Office. Then your receipt will be generated within 24 hours.
        </Text>
      </Card>

      {/* Payment steps card */}
      <Card style={{ marginBottom: theme.spacing.xxl }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: theme.spacing.lg }}>
          <Ionicons name="wallet" size={20} color={theme.colors.primary} />
          <Text style={theme.typography.h3}>Payment Steps</Text>
        </View>

        {/* Mobile Money */}
        <View style={{ marginBottom: theme.spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: theme.spacing.sm }}>
            <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="phone-portrait" size={14} color={theme.colors.primary} />
            </View>
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.text, fontWeight: '700' }]}>Mobile Money</Text>
          </View>
          {[
            'Dial *170# on your phone',
            'Select "Pay Bills" or "Merchant Payment"',
            'Enter INFOTESS MoMo number: 0240 918 031',
            'Enter your index number as reference',
            'Enter the amount to pay',
            'Confirm with your PIN',
            'Screenshot the confirmation and submit it via the app or at the INFOTESS Office',
          ].map((step, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 10, marginBottom: 8, marginLeft: 4 }}>
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: theme.colors.surface3, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: theme.colors.primary }}>{i + 1}</Text>
              </View>
              <Text style={[theme.typography.small, { color: theme.colors.textDim, flex: 1, lineHeight: 18 }]}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: theme.colors.hairline, marginVertical: theme.spacing.sm }} />

        {/* Bank Transfer / Deposit */}
        <View style={{ marginTop: theme.spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: theme.spacing.sm }}>
            <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: `${theme.colors.secondary}15`, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="business" size={14} color={theme.colors.secondary} />
            </View>
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.text, fontWeight: '700' }]}>Bank Transfer / Deposit</Text>
          </View>
          {[
            'Use any of these banks: GCB, Ecobank, or Fidelity',
            'Account Name: INFOTESS IT Department',
            'Account Number: 1234567890',
            'Branch: Kumasi Main',
            'Use your index number as deposit reference',
            'Keep your deposit slip or transfer confirmation',
            'Submit proof via the app or at the INFOTESS office',
          ].map((step, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 10, marginBottom: 8, marginLeft: 4 }}>
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: theme.colors.surface3, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: theme.colors.secondary }}>{i + 1}</Text>
              </View>
              <Text style={[theme.typography.small, { color: theme.colors.textDim, flex: 1, lineHeight: 18 }]}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Note */}
        <View style={{ backgroundColor: theme.isDark ? `${theme.colors.primary}15` : '#e8f5e9', borderRadius: theme.radii.md, padding: theme.spacing.md, marginTop: theme.spacing.md }}>
          <Text style={[theme.typography.small, { color: theme.colors.primary, lineHeight: 18 }]}>
            <Text style={{ fontWeight: '700' }}>Note: </Text>
            After payment, send your proof (screenshot or deposit slip) to the INFOTESS office or submit it via the app. Your receipt will be generated within 24 hours.
          </Text>
        </View>
      </Card>

      {/* Quick links */}
      <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
        <View style={{ flex: 1 }}>
          <PrimaryButton title="Submit Proof" onPress={() => router.push('/(student)/submit-proof')} icon="cloud-upload" />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
        <View style={{ flex: 1 }}>
          <PrimaryButton title="History" onPress={() => router.push('/(student)/payments')} icon="receipt" />
        </View>
        <View style={{ flex: 1 }}>
          <PrimaryButton title="Receipts" onPress={() => router.push('/(student)/receipts')} icon="document-text" />
        </View>
      </View>
    </ScrollView>
  );
}
