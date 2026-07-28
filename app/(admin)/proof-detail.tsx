import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { api, ApiError } from '@/services/api';
import { PaymentProof } from '@/types';
import { Card, PrimaryButton, GhostButton, Field, Badge } from '@/components/ui';
import { useThemeContext } from '@/context/ThemeContext';

export default function ProofDetail() {
  const { theme } = useThemeContext();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [proof, setProof] = useState<PaymentProof | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.adminProofs(undefined, 1);
        const found = r.proofs.find(p => p.id === Number(id));
        if (!found) {
          // Try all pages
          for (let p = 1; p <= r.total_pages; p++) {
            const r2 = await api.adminProofs(undefined, p);
            const f2 = r2.proofs.find(pp => pp.id === Number(id));
            if (f2) { setProof(f2); break; }
          }
        } else {
          setProof(found);
        }
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleApprove = async () => {
    Alert.alert('Approve Proof', `Approve GH₵ ${proof?.amount} payment?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          setActionLoading(true);
          try {
            const r = await api.approveProof(Number(id), reviewNotes || undefined);
            Alert.alert('Approved', `Payment recorded. Receipt: ${r.payment.receipt_number}`, [
              { text: 'OK', onPress: () => router.back() },
            ]);
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to approve');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleReject = async () => {
    Alert.alert('Reject Proof', `Reject this GH₵ ${proof?.amount} submission?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          try {
            await api.rejectProof(Number(id), reviewNotes || undefined);
            Alert.alert('Rejected', 'Proof has been rejected.', [
              { text: 'OK', onPress: () => router.back() },
            ]);
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to reject');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: theme.colors.textDim }}>Loading…</Text>
      </View>
    );
  }

  if (error || !proof) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xxl }}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.colors.danger} />
        <Text style={{ color: theme.colors.danger, marginTop: 12, fontSize: 15 }}>{error || 'Proof not found'}</Text>
        <GhostButton title="Go Back" onPress={() => router.back()} icon="arrow-back" />
      </View>
    );
  }

  const statusColors: Record<string, { bg: string; fg: string }> = {
    pending: { bg: `${theme.colors.accent}20`, fg: theme.colors.accent },
    approved: { bg: `${theme.colors.primary}20`, fg: theme.colors.primary },
    rejected: { bg: `${theme.colors.danger}20`, fg: theme.colors.danger },
  };
  const sc = statusColors[proof.status] || statusColors.pending;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ padding: theme.spacing.xxl, paddingBottom: theme.spacing.huge * 2 }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: theme.spacing.xxl }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: theme.colors.surface3, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="document-text" size={22} color={theme.colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={theme.typography.h1}>Review Proof</Text>
          <Text style={[theme.typography.small, { color: theme.colors.textDim }]}>Verify payment details before recording</Text>
        </View>
      </View>

      {/* Status badge */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: theme.spacing.md }}>
        <View style={{ backgroundColor: sc.bg, paddingHorizontal: 12, paddingVertical: 4, borderRadius: theme.radii.pill }}>
          <Text style={{ color: sc.fg, fontSize: 12, fontWeight: '700', textTransform: 'capitalize' }}>{proof.status}</Text>
        </View>
      </View>

      {/* Student info */}
      <Card style={{ marginBottom: theme.spacing.xxl }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: `${theme.colors.primary}15`, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="person" size={20} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.text, fontWeight: '600' }]}>
              {proof.students?.full_name || `Student #${proof.student_id}`}
            </Text>
            <Text style={[theme.typography.small, { color: theme.colors.textDim }]}>
              {proof.students?.index_number || '—'} · {proof.students?.department || ''} · Level {proof.students?.level || ''}
            </Text>
          </View>
        </View>
      </Card>

      {/* Payment details */}
      <Card style={{ marginBottom: theme.spacing.xxl }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: theme.spacing.md }}>
          <Ionicons name="cash" size={20} color={theme.colors.secondary} />
          <Text style={theme.typography.h3}>Payment Details</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={[theme.typography.small, { color: theme.colors.textMuted, fontWeight: '600' }]}>AMOUNT</Text>
            <Text style={{ fontSize: 28, fontWeight: '800', color: theme.colors.primary, marginTop: 4 }}>GH₵ {Number(proof.amount).toFixed(2)}</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={[theme.typography.small, { color: theme.colors.textMuted, fontWeight: '600' }]}>METHOD</Text>
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.text, marginTop: 4, fontWeight: '600' }]}>{proof.payment_method}</Text>
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: theme.colors.hairline, marginVertical: 8 }} />

        {/* Detail rows */}
        {[
          { label: 'Academic Year', value: proof.academic_year },
          { label: 'Semester', value: proof.semester === '1' ? 'First' : 'Second' },
          { label: 'Reference / Tx ID', value: proof.reference_number || '—' },
          { label: 'Phone Number', value: proof.sender_phone || '—' },
          { label: 'Submitted', value: new Date(proof.created_at).toLocaleString() },
        ].map((row, i) => (
          <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
            <Text style={[theme.typography.small, { color: theme.colors.textMuted }]}>{row.label}</Text>
            <Text style={[theme.typography.small, { color: theme.colors.text, fontWeight: '600' }]}>{row.value}</Text>
          </View>
        ))}

        {proof.notes ? (
          <>
            <View style={{ height: 1, backgroundColor: theme.colors.hairline, marginVertical: 8 }} />
            <Text style={[theme.typography.small, { color: theme.colors.textMuted, marginBottom: 4 }]}>NOTES FROM STUDENT</Text>
            <Text style={[theme.typography.body, { color: theme.colors.text }]}>{proof.notes}</Text>
          </>
        ) : null}
      </Card>

      {/* Admin review notes */}
      {proof.status === 'pending' && (
        <Card style={{ marginBottom: theme.spacing.xxl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: theme.spacing.md }}>
            <Ionicons name="chatbubble-ellipses" size={20} color={theme.colors.secondary} />
            <Text style={theme.typography.h3}>Review Notes</Text>
          </View>
          <Field
            label="Notes (optional)"
            value={reviewNotes}
            onChangeText={setReviewNotes}
            placeholder="Add a reason or note for the student..."
            icon="pencil"
          />
        </Card>
      )}

      {/* Action buttons */}
      {proof.status === 'pending' && (
        <View style={{ gap: theme.spacing.md }}>
          <PrimaryButton
            title="Approve & Record Payment"
            onPress={handleApprove}
            loading={actionLoading}
            icon="checkmark-circle"
          />
          <View style={{ opacity: actionLoading ? 0.5 : 1 }}>
            <GhostButton
              title="Reject Submission"
              onPress={handleReject}
              icon="close-circle"
            />
          </View>
        </View>
      )}

      {proof.status !== 'pending' && (
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name={proof.status === 'approved' ? 'checkmark-circle' : 'close-circle'} size={20} color={sc.fg} />
            <View>
              <Text style={[theme.typography.bodyMedium, { color: theme.colors.text, fontWeight: '600' }]}>
                {proof.status === 'approved' ? 'Approved' : 'Rejected'}
              </Text>
              {proof.reviewed_at && (
                <Text style={[theme.typography.small, { color: theme.colors.textDim }]}>
                  on {new Date(proof.reviewed_at).toLocaleString()}
                </Text>
              )}
              {proof.review_notes && (
                <Text style={[theme.typography.small, { color: theme.colors.textDim, marginTop: 4 }]}>
                  "{proof.review_notes}"
                </Text>
              )}
            </View>
          </View>
        </Card>
      )}
    </ScrollView>
  );
}
