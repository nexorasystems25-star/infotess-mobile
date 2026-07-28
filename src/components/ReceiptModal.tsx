import { Modal, View, Text, ScrollView, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MAROON = '#800020';
const BLUE = '#4F46E5';
const GREEN = '#28a745';
const GRAY = '#666666';

export interface ReceiptParams {
  receipt_number: string;
  payment_date: string;
  payment_method: string;
  amount: string;
  academic_year: string;
  semester: string;
  full_name: string;
  index_number: string;
  department: string;
  level: string;
  total_paid: string;
  required: string;
}

interface ReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  params: ReceiptParams;
  isDark?: boolean;
}

export function ReceiptModal({ visible, onClose, params, isDark = false }: ReceiptModalProps) {
  const amount = Number(params.amount || 0);
  const totalPaid = Number(params.total_paid || 0);
  const required = Number(params.required || 0);
  const balance = Math.max(0, required - totalPaid);
  const status = totalPaid >= required ? 'PAID' : 'PARTIAL';
  const statusColor = totalPaid >= required ? GREEN : '#e67e22';

  const surface = isDark ? '#1a1a2e' : '#fff';
  const hairline = isDark ? '#2a2a3e' : '#ddd';
  const textPrimary = isDark ? '#e0e0e0' : '#333';
  const textSecondary = isDark ? '#999' : GRAY;
  const altBg = isDark ? '#12121f' : '#f8f9fa';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: isDark ? '#0a0a14' : '#f8f9fa' }}>
        {/* Top bar */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12, backgroundColor: surface, borderBottomWidth: 1, borderBottomColor: hairline }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: textPrimary }}>Receipt</Text>
          <Pressable
            onPress={onClose}
            style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: isDark ? '#2a2a3e' : '#f0f0f0', alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="close" size={18} color={textPrimary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
          {/* Receipt card */}
          <View style={{
            backgroundColor: surface,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: hairline,
            padding: 24,
            position: 'relative',
            shadowColor: '#000',
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 6,
          }}>

            {/* Header */}
            <View style={{ borderBottomWidth: 3, borderBottomColor: BLUE, paddingBottom: 16, marginBottom: 20, alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: MAROON, textTransform: 'uppercase', textAlign: 'center', letterSpacing: 1 }}>
                INFOTESS IT DEPARTMENT
              </Text>
              <Text style={{ fontSize: 11, color: textSecondary, marginTop: 3 }}>Infotess.edu.gh, Kumasi, Ghana</Text>
              <Text style={{ fontSize: 11, color: textSecondary, marginTop: 1 }}>Tel: +233 24 091 8031 | Email: info@infotess.edu</Text>
              <Text style={{ fontSize: 14, fontWeight: '800', color: textPrimary, textTransform: 'uppercase', marginTop: 10 }}>
                OFFICIAL PAYMENT RECEIPT
              </Text>
            </View>

            {/* Status stamp */}
            <View style={{ position: 'absolute', top: 140, right: 24, borderWidth: 2, borderColor: statusColor, paddingHorizontal: 10, paddingVertical: 3, transform: [{ rotate: '-12deg' }] }}>
              <Text style={{ fontWeight: '800', fontSize: 14, color: statusColor }}>{status}</Text>
            </View>

            {/* Two-column details */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', fontSize: 13, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: hairline, paddingBottom: 4, color: textPrimary }}>Receipt Details</Text>
                {[
                  ['Receipt No:', params.receipt_number],
                  ['Date:', params.payment_date],
                  ['Method:', params.payment_method],
                ].map(([label, val]) => (
                  <Text key={label} style={{ fontSize: 12, marginBottom: 3 }}>
                    <Text style={{ color: textSecondary, fontWeight: '600' }}>{label} </Text>
                    <Text style={{ color: textPrimary }}>{val}</Text>
                  </Text>
                ))}
              </View>

              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={{ fontWeight: '700', fontSize: 13, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: hairline, paddingBottom: 4, textAlign: 'right', color: textPrimary }}>Student Details</Text>
                {[
                  ['Name:', params.full_name],
                  ['Index No:', params.index_number],
                  ['Department:', params.department],
                  ['Level:', params.level],
                ].map(([label, val]) => (
                  <Text key={label} style={{ fontSize: 12, marginBottom: 3, textAlign: 'right' }}>
                    <Text style={{ color: textSecondary, fontWeight: '600' }}>{label} </Text>
                    <Text style={{ color: textPrimary }}>{val}</Text>
                  </Text>
                ))}
              </View>
            </View>

            {/* Payment table */}
            <View style={{ borderWidth: 1, borderColor: hairline, borderRadius: 2, marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', backgroundColor: altBg, paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: hairline }}>
                <Text style={{ flex: 2.2, fontWeight: '700', fontSize: 11, color: textPrimary }}>Description</Text>
                <Text style={{ flex: 1.2, fontWeight: '700', fontSize: 11, color: textPrimary }}>Year</Text>
                <Text style={{ flex: 0.8, fontWeight: '700', fontSize: 11, color: textPrimary }}>Sem</Text>
                <Text style={{ flex: 1, fontWeight: '700', fontSize: 11, color: textPrimary, textAlign: 'right' }}>Amount</Text>
              </View>
              <View style={{ flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: hairline }}>
                <Text style={{ flex: 2.2, fontSize: 11, color: textPrimary }}>Infotess Dues Payment</Text>
                <Text style={{ flex: 1.2, fontSize: 11, color: textPrimary }}>{params.academic_year}</Text>
                <Text style={{ flex: 0.8, fontSize: 11, color: textPrimary }}>{params.semester}</Text>
                <Text style={{ flex: 1, fontSize: 11, color: textPrimary, textAlign: 'right' }}>GH₵ {amount.toFixed(2)}</Text>
              </View>
              <View style={{ flexDirection: 'row', backgroundColor: altBg, paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: hairline }}>
                <Text style={{ flex: 3.2, fontWeight: '700', fontSize: 11, color: textPrimary, textAlign: 'right' }}>Total Paid:</Text>
                <Text style={{ flex: 1, fontWeight: '700', fontSize: 11, color: textPrimary, textAlign: 'right' }}>GH₵ {totalPaid.toFixed(2)}</Text>
              </View>
              {balance > 0 ? (
                <View style={{ flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 10 }}>
                  <Text style={{ flex: 3.2, fontWeight: '700', fontSize: 11, color: '#cc0000', textAlign: 'right' }}>Balance:</Text>
                  <Text style={{ flex: 1, fontWeight: '700', fontSize: 11, color: '#cc0000', textAlign: 'right' }}>GH₵ {balance.toFixed(2)}</Text>
                </View>
              ) : null}
            </View>

            {/* Signature */}
            <View style={{ alignItems: 'center', marginTop: 20 }}>
              <View style={{ width: 140, borderTopWidth: 1, borderTopColor: textPrimary, paddingTop: 6 }}>
                <Text style={{ fontWeight: '700', fontSize: 11, color: textPrimary, textAlign: 'center' }}>Authorized Signature</Text>
                <Text style={{ fontSize: 10, color: textSecondary, textAlign: 'center', marginTop: 1 }}>Finance Office</Text>
              </View>
            </View>

            {/* Info */}
            <View style={{ backgroundColor: isDark ? '#0d2a2a' : '#e0f7fa', borderWidth: 1, borderColor: isDark ? '#1a4040' : '#b2ebf2', borderRadius: 4, padding: 10, marginTop: 18 }}>
              <Text style={{ fontSize: 10, color: isDark ? '#80cbc4' : '#006064' }}>
                <Text style={{ fontWeight: '700' }}>Information: </Text>
                This is an official digital receipt. Keep this for your records.
              </Text>
            </View>

            <Text style={{ fontSize: 8, color: textSecondary, textAlign: 'center', marginTop: 10 }}>
              Receipt: {params.receipt_number}
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
