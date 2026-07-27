import { useState, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useAuth } from '@/context/AuthContext';
import { useThemeContext } from '@/context/ThemeContext';
import { Field, PrimaryButton, GhostButton } from '@/components/ui';

export default function Login() {
  const router = useRouter();
  const { login, loading, error, clearError, user } = useAuth();
  const { theme } = useThemeContext();
  const [mode, setMode] = useState<'student' | 'admin'>('student');
  const [indexNumber, setIndexNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (user && !loading) {
      router.replace(user.role === 'student' ? '/(student)/home' : '/(admin)/home');
    }
  }, [user, loading]);

  const submit = async () => {
    if (mode === 'student' && !indexNumber) return Alert.alert('Index number required');
    if (mode === 'admin' && !email) return Alert.alert('Email required');
    if (!password) return Alert.alert('Password required');
    const ok = await login({
      ...(mode === 'student' ? { index_number: indexNumber } : { email }),
      password,
      role: mode,
    } as any);
    if (ok) {
      router.replace(mode === 'student' ? '/(student)/home' : '/(admin)/home');
    } else if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  return (
    <LinearGradient colors={theme.isDark ? [theme.colors.bg, '#0E1419', theme.colors.bg] : [theme.colors.bg, '#E8F5F0', theme.colors.bg]} style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: theme.spacing.xxl, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">

          {/* Brand */}
          <View style={{ alignItems: 'center', marginBottom: theme.spacing.xxxl }}>
            <View style={{
              width: 76, height: 76, borderRadius: 24,
              backgroundColor: theme.colors.primary,
              alignItems: 'center', justifyContent: 'center',
              marginBottom: theme.spacing.lg,
              shadowColor: theme.colors.primary, shadowOpacity: 0.5, shadowRadius: 18, shadowOffset: { width: 0, height: 0 }, elevation: 6,
            }}>
              <Ionicons name="shield-checkmark" size={38} color="#00140D" />
            </View>
            <Text style={theme.typography.display}>INFOTESS</Text>
            <Text style={[theme.typography.small, { color: theme.colors.textDim, marginTop: 6, letterSpacing: 2 }]}>SCHOOL DUES MANAGEMENT SYSTEM</Text>
          </View>

          {/* Toggle */}
          <View style={{ flexDirection: 'row', backgroundColor: theme.colors.surface2, borderRadius: theme.radii.pill, padding: 4, marginBottom: theme.spacing.xxl }}>
            {(['student', 'admin'] as const).map((m) => (
              <View
                key={m}
                onTouchEnd={() => { setMode(m); clearError(); }}
                style={{
                  flex: 1, paddingVertical: 12, alignItems: 'center',
                  borderRadius: theme.radii.pill,
                  backgroundColor: mode === m ? theme.colors.primary : 'transparent',
                }}
              >
                <Text style={{ fontWeight: '700', color: mode === m ? '#00140D' : theme.colors.textDim, textTransform: 'capitalize' }}>
                  {m}
                </Text>
              </View>
            ))}
          </View>

          {error ? (
            <View style={{ backgroundColor: `${theme.colors.danger}1A`, borderRadius: theme.radii.md, padding: theme.spacing.md, marginBottom: theme.spacing.md }}>
              <Text style={{ color: theme.colors.danger, fontSize: 14 }}>{error}</Text>
            </View>
          ) : null}

          {mode === 'student' ? (
            <Field label="Index Number" value={indexNumber} onChangeText={setIndexNumber} placeholder="e.g. DCIT101-0123" icon="card" autoCapitalize="none" />
          ) : (
            <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@aamusted.edu.gh" icon="mail" keyboardType="email-address" />
          )}
          <Field label="Password" value={password} onChangeText={setPassword} placeholder="••••••••" icon="lock-closed" secure autoCapitalize="none" />

          <View style={{ marginTop: theme.spacing.xs, marginBottom: theme.spacing.md, alignItems: 'flex-end' }}>
            <Text style={{ color: theme.colors.secondary, fontWeight: '600', fontSize: 14 }}
              onPress={() => router.push('/forgot-password')}>
              Forgot password?
            </Text>
          </View>

          <PrimaryButton title={mode === 'student' ? 'View My Dues' : 'Open Admin Console'} onPress={submit} loading={loading} icon="log-in-outline" />

          {mode === 'admin' ? (
            <View style={{ marginTop: theme.spacing.lg, alignItems: 'center' }}>
              <Text style={[theme.typography.small, { color: theme.colors.textMuted, textAlign: 'center' }]}>
                AAMUSTED INFO-TES Society · Authorized personnel only
              </Text>
            </View>
          ) : (
            <View style={{ marginTop: theme.spacing.lg }}>
              <GhostButton title="Verify a receipt" onPress={() => router.push('/verify')} icon="qr-code-outline" />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
