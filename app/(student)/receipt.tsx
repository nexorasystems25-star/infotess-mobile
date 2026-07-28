import { View, Text, ScrollView, Pressable, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useThemeContext } from '@/context/ThemeContext';

const MAROON = '#800020';
const BLUE = '#4F46E5';
const GREEN = '#28a745';
const GRAY = '#666666';

export default function StudentReceiptScreen() {
  const { theme } = useThemeContext();
  const router = useRouter();
  const params = useLocalSearchParams<{
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
  }>();

  const amount = Number(params.amount || 0);
  const totalPaid = Number(params.total_paid || 0);
  const required = Number(params.required || 0);
  const balance = Math.max(0, required - totalPaid);
  const status = totalPaid >= required ? 'PAID' : 'PARTIAL';
  const statusColor = totalPaid >= required ? GREEN : '#e67e22';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.bg }} contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="arrow-back" size={20} color={BLUE} />
          <Text style={{ color: BLUE, fontWeight: '600', fontSize: 15 }}>Back</Text>
        </Pressable>
      </View>

      <View style={{ backgroundColor: theme.colors.surface, borderRadius: 4, borderWidth: 1, borderColor: theme.colors.hairline, padding: 28, position: 'relative', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}>

        <View style={{ borderBottomWidth: 3, borderBottomColor: BLUE, paddingBottom: 18, marginBottom: 24, alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: MAROON, textTransform: 'uppercase', textAlign: 'center', letterSpacing: 1 }}>
            INFOTESS IT DEPARTMENT
          </Text>
          <Text style={{ fontSize: 12, color: GRAY, marginTop: 3 }}>Infotess.edu.gh, Kumasi, Ghana</Text>
          <Text style={{ fontSize: 12, color: GRAY, marginTop: 1 }}>Tel: +233 24 091 8031 | Email: info@infotess.edu</Text>
          <Text style={{ fontSize: 15, fontWeight: '800', color: theme.colors.text, textTransform: 'uppercase', marginTop: 12 }}>
            OFFICIAL PAYMENT RECEIPT
          </Text>
        </View>

        <View style={{ position: 'absolute', top: 150, right: 28, borderWidth: 2, borderColor: statusColor, paddingHorizontal: 10, paddingVertical: 3, transform: [{ rotate: '-12deg' }] }}>
          <Text style={{ fontWeight: '800', fontSize: 15, color: statusColor }}>{status}</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700', fontSize: 14, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.hairline, paddingBottom: 4 }}>Receipt Details</Text>
            {[
              ['Receipt No:', params.receipt_number],
              ['Date:', params.payment_date],
              ['Method:', params.payment_method],
            ].map(([label, val]) => (
              <Text key={label} style={{ fontSize: 13, marginBottom: 3 }}>
                <Text style={{ color: GRAY, fontWeight: '600' }}>{label} </Text>
                <Text style={{ color: theme.colors.text }}>{val}</Text>
              </Text>
            ))}
          </View>

          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={{ fontWeight: '700', fontSize: 14, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.hairline, paddingBottom: 4, textAlign: 'right' }}>Student Details</Text>
            {[
              ['Name:', params.full_name],
              ['Index No:', params.index_number],
              ['Department:', params.department],
              ['Level:', params.level],
            ].map(([label, val]) => (
              <Text key={label} style={{ fontSize: 13, marginBottom: 3, textAlign: 'right' }}>
                <Text style={{ color: GRAY, fontWeight: '600' }}>{label} </Text>
                <Text style={{ color: theme.colors.text }}>{val}</Text>
              </Text>
            ))}
          </View>
        </View>

        <View style={{ borderWidth: 1, borderColor: theme.colors.hairline, borderRadius: 2, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', backgroundColor: theme.colors.surface2, paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.hairline }}>
            <Text style={{ flex: 2.2, fontWeight: '700', fontSize: 12, color: theme.colors.text }}>Description</Text>
            <Text style={{ flex: 1.2, fontWeight: '700', fontSize: 12, color: theme.colors.text }}>Academic Year</Text>
            <Text style={{ flex: 0.8, fontWeight: '700', fontSize: 12, color: theme.colors.text }}>Semester</Text>
            <Text style={{ flex: 1, fontWeight: '700', fontSize: 12, color: theme.colors.text, textAlign: 'right' }}>Amount</Text>
          </View>
          <View style={{ flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.hairline }}>
            <Text style={{ flex: 2.2, fontSize: 12, color: theme.colors.text }}>Infotess Dues Payment</Text>
            <Text style={{ flex: 1.2, fontSize: 12, color: theme.colors.text }}>{params.academic_year}</Text>
            <Text style={{ flex: 0.8, fontSize: 12, color: theme.colors.text }}>{params.semester}</Text>
            <Text style={{ flex: 1, fontSize: 12, color: theme.colors.text, textAlign: 'right' }}>GH₵ {amount.toFixed(2)}</Text>
          </View>
          <View style={{ flexDirection: 'row', backgroundColor: theme.colors.surface2, paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.hairline }}>
            <Text style={{ flex: 4.2, fontWeight: '700', fontSize: 12, color: theme.colors.text, textAlign: 'right' }}>Total Amount Paid:</Text>
            <Text style={{ flex: 1, fontWeight: '700', fontSize: 12, color: theme.colors.text, textAlign: 'right' }}>GH₵ {totalPaid.toFixed(2)}</Text>
          </View>
          {balance > 0 ? (
            <View style={{ flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12 }}>
              <Text style={{ flex: 4.2, fontWeight: '700', fontSize: 12, color: '#cc0000', textAlign: 'right' }}>Remaining Balance:</Text>
              <Text style={{ flex: 1, fontWeight: '700', fontSize: 12, color: '#cc0000', textAlign: 'right' }}>GH₵ {balance.toFixed(2)}</Text>
            </View>
          ) : null}
        </View>

        <View style={{ alignItems: 'center', marginTop: 28 }}>
          <View style={{ width: 150, borderTopWidth: 1, borderTopColor: '#333', paddingTop: 6 }}>
            <Text style={{ fontWeight: '700', fontSize: 12, color: '#333', textAlign: 'center' }}>Authorized Signature</Text>
            <Text style={{ fontSize: 11, color: GRAY, textAlign: 'center', marginTop: 1 }}>Finance Office</Text>
          </View>
        </View>

        <View style={{ backgroundColor: '#e0f7fa', borderWidth: 1, borderColor: '#b2ebf2', borderRadius: 4, padding: 12, marginTop: 24 }}>
          <Text style={{ fontSize: 11, color: '#006064' }}>
            <Text style={{ fontWeight: '700' }}>Information: </Text>
            This is an official digital receipt. Keep this for your records. You can access this receipt anytime from the payment records.
          </Text>
        </View>

        <Text style={{ fontSize: 9, color: '#999', textAlign: 'center', marginTop: 12 }}>
          Receipt: {params.receipt_number}
        </Text>
      </View>
    </ScrollView>
  );
}
