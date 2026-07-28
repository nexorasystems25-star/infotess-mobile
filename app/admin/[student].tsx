import { useEffect, useState } from 'react';
import { ScrollView, View, Text, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { api, ApiError } from '@/services/api';
import { StudentDues, Payment } from '@/types';
import { Card, Badge, SectionHeader, Stat, GhostButton } from '@/components/ui';
import { useThemeContext } from '@/context/ThemeContext';
import { ReceiptModal, ReceiptParams } from '@/components/ReceiptModal';

function fmtGHS(n: number | string) { return `GH₵ ${Number(n || 0).toFixed(2)}`; }

export default function StudentDetail() {
  const { theme } = useThemeContext();
  const { student: studentIdParam } = useLocalSearchParams<{ student: string }>();
  const router = useRouter();
  const [dues, setDues] = useState<StudentDues | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [receiptParams, setReceiptParams] = useState<ReceiptParams | null>(null);

  const studentId = Number(studentIdParam);

  const load = async () => {
    setRefreshing(true);
    try {
      const r = await api.studentDues(studentId);
      setDues(r.dues);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load student');
    } finally { setRefreshing(false); setLoading(false); }
  };
  useEffect(() => { if (studentId) load(); }, [studentId]);

  const handleReceipt = async (paymentId: number) => {
    setDownloadingId(paymentId);
    try {
      const r = await api.getReceipt(paymentId, 'admin');
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

  const pct = dues && dues.total_due > 0 ? Math.min(100, (dues.total_paid / dues.total_due) * 100) : 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ padding: theme.spacing.xxl, paddingTop: 60, paddingBottom: theme.spacing.huge * 2 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={theme.colors.primary} />}
    >
      {/* Back */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xxl }}>
        <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: theme.colors.surface3, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}
          onTouchEnd={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={theme.colors.textDim} />
        </View>
        <Text style={theme.typography.h1}>Student</Text>
      </View>

      {error ? (
        <Card style={{ borderColor: theme.colors.danger, marginBottom: theme.spacing.lg }}>
          <Text style={{ color: theme.colors.danger }}>{error}</Text>
        </Card>
      ) : null}

      {/* Profile card */}
      {dues?.student ? (
        <Card style={{ marginBottom: theme.spacing.xxl }}>
          <View style={{ flexDirection: 'row', gap: 14 }}>
            <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.primary }}>
              <Ionicons name="person" size={26} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={theme.typography.h2}>{dues.student.full_name}</Text>
              <Text style={[theme.typography.small, { color: theme.colors.textDim, marginTop: 4 }]}>
                {dues.student.index_number} · {dues.student.department} — Lvl {dues.student.level}
              </Text>
              {dues.student.phone_number ? (
                <Text style={[theme.typography.small, { color: theme.colors.secondary, marginTop: 2 }]}>📞 {dues.student.phone_number}</Text>
              ) : null}
            </View>
          </View>
        </Card>
      ) : null}

      {/* Dues summary */}
      {dues ? (
        <Card style={{ marginBottom: theme.spacing.xxl }}>
          <Text style={[theme.typography.small, { color: theme.colors.textDim, letterSpacing: 1, textTransform: 'uppercase' }]}>
            {dues.academic_year} · {dues.semester}
          </Text>
          <View style={{ flexDirection: 'row', gap: theme.spacing.xxl, marginTop: theme.spacing.md }}>
            <View>
              <Text style={[theme.typography.small, { color: theme.colors.textMuted }]}>OUTSTANDING</Text>
              <Text style={[theme.typography.h1, { color: dues.outstanding > 0 ? theme.colors.accent : theme.colors.primary }]}>
                {fmtGHS(dues.outstanding)}
              </Text>
            </View>
            <View>
              <Text style={[theme.typography.small, { color: theme.colors.textMuted }]}>PAID</Text>
              <Text style={[theme.typography.h2, { color: theme.colors.primary }]}>{fmtGHS(dues.total_paid)}</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={{ height: 6, backgroundColor: theme.colors.surface3, borderRadius: theme.radii.pill, marginTop: theme.spacing.lg, marginBottom: 4 }}>
            <View style={{ height: 6, width: `${pct}%`, backgroundColor: theme.colors.primary, borderRadius: theme.radii.pill }} />
          </View>

          <Badge label={dues.status === 'paid' ? 'Fully paid' : dues.status === 'partially_paid' ? 'Partially paid' : 'Unpaid'}
            tone={dues.status === 'paid' ? 'primary' : dues.status === 'partially_paid' ? 'accent' : 'danger'} />
        </Card>
      ) : null}

      {/* Payment history */}
      <SectionHeader title="Payment history" action={`${dues?.payments?.length ?? 0} payments`} />
      {(dues?.payments ?? []).map((p) => (
        <Card key={p.id} elevation="soft" style={{ marginBottom: theme.spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={[theme.typography.h3, { color: theme.colors.primary }]}>{fmtGHS(p.amount)}</Text>
              <Text style={[theme.typography.small, { color: theme.colors.textDim, marginTop: 2 }]}>{p.payment_method} · {p.payment_date}</Text>
            </View>
            <Text style={[theme.typography.mono, { color: theme.colors.secondary }]}>{p.receipt_number}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: theme.spacing.sm, borderTopWidth: 1, borderTopColor: theme.colors.hairline, paddingTop: theme.spacing.sm }}>
            <GhostButton
              title={downloadingId === p.id ? 'Opening...' : 'Receipt'}
              onPress={() => handleReceipt(p.id)}
              icon="document-text-outline"
            />
          </View>
        </Card>
      ))}
      {dues && dues.payments.length === 0 ? (
        <Card><Text style={[theme.typography.body, { color: theme.colors.textDim }]}>No payments recorded for this semester.</Text></Card>
      ) : null}

      <ReceiptModal
        visible={receiptVisible}
        onClose={() => setReceiptVisible(false)}
        params={receiptParams || { receipt_number: '', payment_date: '', payment_method: '', amount: '0', academic_year: '', semester: '', full_name: '', index_number: '', department: '', level: '', total_paid: '0', required: '0' }}
        isDark={theme.isDark}
      />
    </ScrollView>
  );
}
