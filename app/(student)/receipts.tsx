import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, ApiError } from '@/services/api';
import { Payment } from '@/types';
import { useThemeContext } from '@/context/ThemeContext';
import { ReceiptModal, ReceiptParams } from '@/components/ReceiptModal';

const MAROON = '#800020';
const BLUE = '#4F46E5';
const GREEN = '#28a745';

export default function StudentReceipts() {
  const { theme } = useThemeContext();
  const [items, setItems] = useState<Payment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [receiptParams, setReceiptParams] = useState<ReceiptParams | null>(null);

  const load = async () => {
    setRefreshing(true);
    try { const r = await api.myPayments(); setItems(r.payments); setError(null); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Load failed'); }
    finally { setRefreshing(false); }
  };
  useEffect(() => { load(); }, []);

  const handleReceipt = async (item: Payment) => {
    try {
      const r = await api.getReceipt(item.id, 'student');
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
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, padding: theme.spacing.xxl }}>
      <View style={{ marginBottom: theme.spacing.xxl }}>
        <Text style={theme.typography.h1}>My Receipts</Text>
        <Text style={[theme.typography.body, { color: theme.colors.textDim, marginTop: 4 }]}>Tap a receipt to view details.</Text>
      </View>

      {error ? <Text style={{ color: theme.colors.danger, textAlign: 'center', marginTop: theme.spacing.xxl }}>{error}</Text> : null}

      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={theme.colors.primary} />}
        contentContainerStyle={{ paddingBottom: theme.spacing.xxxl }}
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing.lg }} />}
        ListEmptyComponent={
          <View style={{ marginTop: 60, alignItems: 'center' }}>
            <Ionicons name="document-text-outline" size={48} color={theme.colors.textMuted} />
            <Text style={{ color: theme.colors.textDim, marginTop: 12, fontSize: 15 }}>No receipts yet.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => handleReceipt(item)}>
            <View style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radii.lg,
              borderWidth: 1,
              borderColor: theme.colors.hairline,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 3 },
              elevation: 3,
            }}>
              {/* Mini receipt header */}
              <View style={{
                backgroundColor: theme.isDark ? '#1a1028' : '#f5f0fa',
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderBottomWidth: 2,
                borderBottomColor: BLUE,
                alignItems: 'center',
              }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: MAROON, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  INFOTESS IT DEPARTMENT
                </Text>
                <Text style={{ fontSize: 9, color: theme.colors.textDim, marginTop: 1 }}>OFFICIAL PAYMENT RECEIPT</Text>
              </View>

              {/* Receipt body */}
              <View style={{ padding: 14 }}>
                {/* Top row: receipt number + status */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={[theme.typography.mono, { color: theme.colors.secondary, fontSize: 11 }]}>
                    {item.receipt_number}
                  </Text>
                  <View style={{
                    backgroundColor: GREEN,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 4,
                  }}>
                    <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>PAID</Text>
                  </View>
                </View>

                {/* Details grid */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 9, color: theme.colors.textMuted, fontWeight: '600', textTransform: 'uppercase' }}>Date</Text>
                    <Text style={{ fontSize: 12, color: theme.colors.text, marginTop: 1 }}>{item.payment_date}</Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontSize: 9, color: theme.colors.textMuted, fontWeight: '600', textTransform: 'uppercase' }}>Method</Text>
                    <Text style={{ fontSize: 12, color: theme.colors.text, marginTop: 1 }}>{item.payment_method}</Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 9, color: theme.colors.textMuted, fontWeight: '600', textTransform: 'uppercase' }}>Year</Text>
                    <Text style={{ fontSize: 12, color: theme.colors.text, marginTop: 1 }}>{item.academic_year} — {item.semester}</Text>
                  </View>
                </View>

                {/* Divider */}
                <View style={{ height: 1, backgroundColor: theme.colors.hairline, marginVertical: 8 }} />

                {/* Amount */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: theme.colors.textDim }}>Amount Paid</Text>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: theme.colors.primary }}>GH₵ {Number(item.amount).toFixed(2)}</Text>
                </View>
              </View>

              {/* Tap to view footer */}
              <View style={{
                backgroundColor: theme.isDark ? theme.colors.surface2 : '#f8f9fa',
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderTopWidth: 1,
                borderTopColor: theme.colors.hairline,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 6,
              }}>
                <Ionicons name="eye-outline" size={14} color={theme.colors.primary} />
                <Text style={{ fontSize: 11, fontWeight: '600', color: theme.colors.primary }}>View Full Receipt</Text>
              </View>
            </View>
          </Pressable>
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
