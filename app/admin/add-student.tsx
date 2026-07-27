import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Text,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { api, ApiError } from '@/services/api';
import { Field, PrimaryButton, GhostButton } from '@/components/ui';
import { useThemeContext } from '@/context/ThemeContext';

const DEPARTMENTS = ['Computer Science', 'Information Technology', 'Engineering', 'Business', 'Mathematics'];
const LEVELS = ['100', '200', '300', '400'];

export default function AddStudent() {
  const router = useRouter();
  const { theme } = useThemeContext();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [indexNumber, setIndexNumber] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [level, setLevel] = useState('100');
  const [password, setPassword] = useState('student123');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  const submit = async () => {
    if (!fullName.trim() || !email.trim() || !indexNumber.trim()) {
      Alert.alert('Missing fields', 'Full name, email, and index number are required.');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Missing fields', 'Enter a password for the student account.');
      return;
    }

    setBusy(true);
    try {
      await api.createUser({
        email: email.trim(),
        password: password.trim(),
        role: 'student',
        full_name: fullName.trim(),
        index_number: indexNumber.trim(),
        department,
        level,
      });
      setSuccess(true);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : 'Failed to create student';
      Alert.alert('Error', msg);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setBusy(false);
    }
  };

  if (success) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, padding: theme.spacing.xxl, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.xxl }}>
          <Ionicons name="checkmark-circle" size={44} color="#00140D" />
        </View>
        <Text style={theme.typography.h1}>Student created</Text>
        <Text style={[theme.typography.body, { color: theme.colors.textDim, marginTop: theme.spacing.sm, textAlign: 'center' }]}>
          {fullName} has been registered as {indexNumber}.
        </Text>
        <View style={{ marginTop: theme.spacing.xxl, width: '100%', gap: theme.spacing.md }}>
          <PrimaryButton title="Add another" onPress={() => { setSuccess(false); setFullName(''); setEmail(''); setIndexNumber(''); }} icon="person-add" />
          <GhostButton title="Back to dashboard" onPress={() => router.back()} icon="arrow-back" />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.xxl, paddingTop: 60, paddingBottom: theme.spacing.huge * 2 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xxl }}>
          <Text style={theme.typography.h1}>New student</Text>
          <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: theme.colors.surface3, alignItems: 'center', justifyContent: 'center' }}
            onTouchEnd={() => router.back()}>
            <Ionicons name="close" size={20} color={theme.colors.textDim} />
          </View>
        </View>

        <Field label="Full name" value={fullName} onChangeText={setFullName} placeholder="e.g. Ama Serwaa" icon="person" autoCapitalize="words" />
        <Field label="Email" value={email} onChangeText={setEmail} placeholder="e.g. ama@student.com" icon="mail" keyboardType="email-address" />
        <Field label="Index number" value={indexNumber} onChangeText={setIndexNumber} placeholder="e.g. INF/2024/004" icon="finger-print" autoCapitalize="characters" />

        {/* Department picker */}
        <View style={{ marginBottom: theme.spacing.md }}>
          <Text style={[theme.typography.small, { color: theme.colors.textDim, marginBottom: theme.spacing.xs }]}>Department</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {DEPARTMENTS.map((d) => (
              <View
                key={d}
                onTouchEnd={() => setDepartment(d)}
                style={{
                  paddingVertical: 10, paddingHorizontal: 14,
                  borderRadius: theme.radii.md, borderWidth: 1,
                  backgroundColor: department === d ? theme.colors.primary : theme.colors.surface2,
                  borderColor: department === d ? theme.colors.primary : theme.colors.hairline,
                }}
              >
                <Text style={{ fontWeight: '600', fontSize: 13, color: department === d ? '#00140D' : theme.colors.textDim }}>{d}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Level picker */}
        <View style={{ marginBottom: theme.spacing.md }}>
          <Text style={[theme.typography.small, { color: theme.colors.textDim, marginBottom: theme.spacing.xs }]}>Level</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {LEVELS.map((l) => (
              <View
                key={l}
                onTouchEnd={() => setLevel(l)}
                style={{
                  flex: 1, paddingVertical: 12, alignItems: 'center',
                  borderRadius: theme.radii.md, borderWidth: 1,
                  backgroundColor: level === l ? theme.colors.primary : theme.colors.surface2,
                  borderColor: level === l ? theme.colors.primary : theme.colors.hairline,
                }}
              >
                <Text style={{ fontWeight: '700', fontSize: 14, color: level === l ? '#00140D' : theme.colors.textDim }}>Lvl {l}</Text>
              </View>
            ))}
          </View>
        </View>

        <Field label="Password" value={password} onChangeText={setPassword} placeholder="Default password" icon="lock-closed" secure />

        <PrimaryButton title="Create student" onPress={submit} loading={busy} icon="checkmark-circle" />
        <View style={{ marginTop: theme.spacing.md }}>
          <GhostButton title="Cancel" onPress={() => router.back()} icon="arrow-back" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
