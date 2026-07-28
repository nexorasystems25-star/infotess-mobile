import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { api } from '@/services/api';
import { Card, PrimaryButton } from '@/components/ui';
import { useThemeContext } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

export default function SubmitProof() {
  const { theme } = useThemeContext();
  const { student } = useAuth();
  const router = useRouter();

  const [method, setMethod] = useState<string>('Mobile Money');
  const [amount, setAmount] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const currentYear = new Date().getFullYear().toString();
  const currentSemester = new Date().getMonth() < 6 ? '1' : '2';

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access to upload proof of payment.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 || null);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access to take a photo of your proof.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 || null);
    }
  };

  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return Alert.alert('Error', 'Enter a valid amount');
    if (!method) return Alert.alert('Error', 'Select a payment method');

    setLoading(true);
    try {
      const proofData: any = {
        payment_method: method,
        amount: amt,
        academic_year: currentYear,
        semester: currentSemester,
      };
      if (refNumber) proofData.reference_number = refNumber;
      if (phone) proofData.sender_phone = phone;
      if (notes) proofData.notes = notes;
      if (imageBase64) proofData.proof_image_url = `data:image/jpeg;base64,${imageBase64}`;

      await api.submitProof(proofData);
      Alert.alert('Submitted', 'Your proof of payment has been submitted for review.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit proof');
    } finally {
      setLoading(false);
    }
  };

  const methods = ['Mobile Money', 'Bank Transfer / Deposit'];

  const inputBg = theme.isDark ? '#1e1e2e' : '#f5f5f8';
  const borderCol = theme.isDark ? '#2a2a3e' : '#e0e0e6';
  const surfaceBg = theme.isDark ? theme.colors.surface2 : theme.colors.surface;

  const inputStyle = {
    flex: 1,
    marginLeft: 10,
    color: theme.colors.text as string,
    fontSize: 15 as number,
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ padding: theme.spacing.xxl, paddingBottom: theme.spacing.huge * 2 }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: theme.spacing.xxl }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="cloud-upload" size={22} color={theme.colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={theme.typography.h1}>Submit Proof</Text>
          <Text style={[theme.typography.small, { color: theme.colors.textDim }]}>Upload payment details for admin review</Text>
        </View>
      </View>

      {/* Student info card */}
      <Card style={{ marginBottom: theme.spacing.xxl }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="person" size={18} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.text, fontWeight: '600' }]}>{student?.full_name || 'Student'}</Text>
            <Text style={[theme.typography.small, { color: theme.colors.textDim }]}>{student?.index_number || '—'}</Text>
          </View>
        </View>
        <View style={{ height: 1, backgroundColor: theme.colors.hairline, marginVertical: theme.spacing.md }} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xl }}>
          <View>
            <Text style={[theme.typography.small, { color: theme.colors.textMuted, fontSize: 10, letterSpacing: 0.5 }]}>ACADEMIC YEAR</Text>
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.text, marginTop: 2 }]}>{currentYear}</Text>
          </View>
          <View>
            <Text style={[theme.typography.small, { color: theme.colors.textMuted, fontSize: 10, letterSpacing: 0.5 }]}>SEMESTER</Text>
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.text, marginTop: 2 }]}>{currentSemester === '1' ? 'First' : 'Second'}</Text>
          </View>
          {student?.department ? (
            <View style={{ minWidth: 100 }}>
              <Text style={[theme.typography.small, { color: theme.colors.textMuted, fontSize: 10, letterSpacing: 0.5 }]}>DEPARTMENT</Text>
              <Text style={[theme.typography.bodyMedium, { color: theme.colors.text, marginTop: 2 }]} numberOfLines={1}>{student.department}</Text>
            </View>
          ) : null}
          {student?.level ? (
            <View>
              <Text style={[theme.typography.small, { color: theme.colors.textMuted, fontSize: 10, letterSpacing: 0.5 }]}>LEVEL</Text>
              <Text style={[theme.typography.bodyMedium, { color: theme.colors.text, marginTop: 2 }]}>{student.level}</Text>
            </View>
          ) : null}
        </View>
      </Card>

      {/* Payment method */}
      <Text style={[theme.typography.small, { color: theme.colors.textDim, marginBottom: theme.spacing.sm, fontWeight: '700', letterSpacing: 0.5 }]}>
        PAYMENT METHOD
      </Text>
      <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.xxl }}>
        {methods.map((m) => {
          const selected = method === m;
          const isMomo = m === 'Mobile Money';
          return (
            <Pressable
              key={m}
              onPress={() => setMethod(m)}
              style={{
                flex: 1,
                paddingVertical: 14,
                paddingHorizontal: 12,
                borderRadius: theme.radii.lg,
                borderWidth: 1.5,
                borderColor: selected ? theme.colors.primary : borderCol,
                backgroundColor: selected ? `${theme.colors.primary}12` : surfaceBg,
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Ionicons
                name={isMomo ? 'phone-portrait' : 'business'}
                size={20}
                color={selected ? theme.colors.primary : theme.colors.textDim}
              />
              <Text style={{
                color: selected ? theme.colors.primary : theme.colors.textDim,
                fontSize: 12,
                fontWeight: selected ? '700' : '500',
                textAlign: 'center',
              }}>
                {m}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Amount */}
      <View style={{ marginBottom: theme.spacing.lg }}>
        <Text style={[theme.typography.small, { color: theme.colors.textDim, marginBottom: 6, fontWeight: '600' }]}>AMOUNT (GH₵)</Text>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: inputBg,
          borderRadius: theme.radii.lg,
          borderWidth: 1,
          borderColor: borderCol,
          paddingHorizontal: 14,
          height: 48,
        }}>
          <Ionicons name="cash" size={18} color={theme.colors.textDim} />
          <Text style={{ color: theme.colors.textDim, fontSize: 16, marginLeft: 8, marginRight: 4 }}>GH₵</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="e.g. 100"
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="numeric"
            style={inputStyle}
          />
        </View>
      </View>

      {/* Reference */}
      <View style={{ marginBottom: theme.spacing.lg }}>
        <Text style={[theme.typography.small, { color: theme.colors.textDim, marginBottom: 6, fontWeight: '600' }]}>
          {method === 'Mobile Money' ? 'TRANSACTION ID' : 'REFERENCE NUMBER'}
        </Text>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: inputBg,
          borderRadius: theme.radii.lg,
          borderWidth: 1,
          borderColor: borderCol,
          paddingHorizontal: 14,
          height: 48,
        }}>
          <Ionicons name="finger-print" size={18} color={theme.colors.textDim} />
          <TextInput
            value={refNumber}
            onChangeText={setRefNumber}
            placeholder={method === 'Mobile Money' ? 'e.g. 1234567890' : 'e.g. DEP-12345'}
            placeholderTextColor={theme.colors.textMuted}
            style={inputStyle}
          />
        </View>
      </View>

      {/* Phone (for MoMo) */}
      {method === 'Mobile Money' && (
        <View style={{ marginBottom: theme.spacing.lg }}>
          <Text style={[theme.typography.small, { color: theme.colors.textDim, marginBottom: 6, fontWeight: '600' }]}>PHONE NUMBER</Text>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: inputBg,
            borderRadius: theme.radii.lg,
            borderWidth: 1,
            borderColor: borderCol,
            paddingHorizontal: 14,
            height: 48,
          }}>
            <Ionicons name="call" size={18} color={theme.colors.textDim} />
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. 0240 918 031"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="phone-pad"
              style={inputStyle}
            />
          </View>
        </View>
      )}

      {/* Notes */}
      <View style={{ marginBottom: theme.spacing.xxl }}>
        <Text style={[theme.typography.small, { color: theme.colors.textDim, marginBottom: 6, fontWeight: '600' }]}>ADDITIONAL NOTES (OPTIONAL)</Text>
        <View style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          backgroundColor: inputBg,
          borderRadius: theme.radii.lg,
          borderWidth: 1,
          borderColor: borderCol,
          paddingHorizontal: 14,
          paddingVertical: 12,
          minHeight: 60,
        }}>
          <Ionicons name="chatbubble-ellipses" size={18} color={theme.colors.textDim} style={{ marginTop: 2 }} />
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Any extra info for the admin..."
            placeholderTextColor={theme.colors.textMuted}
            multiline
            numberOfLines={2}
            style={{ ...inputStyle, minHeight: 36 }}
          />
        </View>
      </View>

      {/* Proof Image Upload */}
      <Text style={[theme.typography.small, { color: theme.colors.textDim, marginBottom: theme.spacing.sm, fontWeight: '700', letterSpacing: 0.5 }]}>
        PAYMENT PROOF (OPTIONAL)
      </Text>
      <Text style={[theme.typography.small, { color: theme.colors.textMuted, marginBottom: theme.spacing.md, lineHeight: 18 }]}>
        Upload a screenshot or photo of your payment confirmation
      </Text>

      {imageUri ? (
        <View style={{ marginBottom: theme.spacing.xxl, borderRadius: theme.radii.lg, overflow: 'hidden' }}>
          <Image source={{ uri: imageUri }} style={{ width: '100%', height: 200, borderRadius: theme.radii.lg }} resizeMode="cover" />
          <Pressable
            onPress={() => { setImageUri(null); setImageBase64(null); }}
            style={{
              position: 'absolute', top: 10, right: 10,
              backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 16, width: 32, height: 32,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Ionicons name="close" size={18} color="#fff" />
          </Pressable>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.xxl }}>
          <Pressable
            onPress={pickImage}
            style={{
              flex: 1,
              backgroundColor: surfaceBg,
              borderRadius: theme.radii.lg,
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: theme.colors.primary,
              paddingVertical: 24,
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Ionicons name="images" size={28} color={theme.colors.primary} />
            <Text style={{ color: theme.colors.primary, fontSize: 13, fontWeight: '600' }}>Gallery</Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>Pick from photos</Text>
          </Pressable>
          <Pressable
            onPress={takePhoto}
            style={{
              flex: 1,
              backgroundColor: surfaceBg,
              borderRadius: theme.radii.lg,
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: theme.colors.secondary,
              paddingVertical: 24,
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Ionicons name="camera" size={28} color={theme.colors.secondary} />
            <Text style={{ color: theme.colors.secondary, fontSize: 13, fontWeight: '600' }}>Camera</Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>Take a photo</Text>
          </Pressable>
        </View>
      )}

      {/* Submit */}
      <PrimaryButton
        title="Submit for Review"
        onPress={handleSubmit}
        loading={loading}
        disabled={!amount || parseFloat(amount) <= 0}
        icon="checkmark-circle"
      />

      <Text style={[theme.typography.small, { color: theme.colors.textDim, textAlign: 'center', marginTop: theme.spacing.lg, lineHeight: 18 }]}>
        Your submission will be reviewed by an admin.{'\n'}You will receive a notification once approved.
      </Text>
    </ScrollView>
  );
}
