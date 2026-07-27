import { useState } from 'react';
import { Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Field, PrimaryButton } from '@/components/ui';
import { api } from '@/services/api';
import { useThemeContext } from '@/context/ThemeContext';
import { Text } from 'react-native';

export default function ForgotPassword() {
  const router = useRouter();
  const { theme } = useThemeContext();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!email) return Alert.alert('Enter your email');
    setSending(true);
    try {
      await api.forgotPassword(email);
      Alert.alert('Check your email', 'A reset link has been sent if the email exists.');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not request reset');
    } finally { setSending(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, padding: theme.spacing.xxl, justifyContent: 'center' }}>
      <Text style={theme.typography.h1}>Reset password</Text>
      <Text style={[theme.typography.body, { color: theme.colors.textDim, marginTop: theme.spacing.sm }]}>
        Enter your email and we'll send you a reset link.
      </Text>
      <View style={{ marginTop: theme.spacing.xxl }}>
        <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" icon="mail" keyboardType="email-address" />
        <PrimaryButton title="Send reset link" onPress={submit} loading={sending} icon="send" />
      </View>
    </View>
  );
}
