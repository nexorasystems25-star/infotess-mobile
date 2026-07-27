import { useState, useEffect } from 'react';
import { Text, View, Pressable, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/context/AuthContext';
import { useThemeContext } from '@/context/ThemeContext';
import { api } from '@/services/api';
import { Card } from '@/components/ui';

const MODES = [
  { key: 'dark' as const, label: 'Dark', icon: 'moon' as const },
  { key: 'light' as const, label: 'Light', icon: 'sunny' as const },
  { key: 'system' as const, label: 'System', icon: 'phone-portrait' as const },
];

export default function AdminProfile() {
  const { user, logout } = useAuth();
  const { theme, mode, setMode } = useThemeContext();
  const [duesAmount, setDuesAmount] = useState('200');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getSettings().then((r) => {
      if (r.settings.annual_dues_amount) setDuesAmount(r.settings.annual_dues_amount);
    }).catch(() => {});
  }, []);

  const saveDues = async () => {
    const val = parseFloat(duesAmount);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Invalid amount', 'Enter a positive number for annual dues.');
      return;
    }
    setSaving(true);
    try {
      await api.updateSettings({ annual_dues_amount: val });
      Alert.alert('Saved', `Annual dues set to GH₵ ${val}`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, padding: theme.spacing.xxl }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: theme.spacing.xxl }}>
        <View style={{
          width: 64, height: 64, borderRadius: 20,
          backgroundColor: theme.colors.primarySoft,
          alignItems: 'center', justifyContent: 'center',
          borderWidth: 1, borderColor: theme.colors.primary,
        }}>
          <Ionicons name="shield-checkmark" color={theme.colors.primary} size={30} />
        </View>
        <View>
          <Text style={theme.typography.h2}>{user ? (user.email.split('@')[0] || 'Admin') : 'Admin'}</Text>
          <Text style={[theme.typography.small, { color: theme.colors.textDim, marginTop: 4 }]}>{user?.email}</Text>
        </View>
      </View>

      {/* Theme toggle */}
      <Card style={{ marginBottom: theme.spacing.lg }}>
        <Text style={[theme.typography.h3, { marginBottom: theme.spacing.md }]}>Appearance</Text>
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          {MODES.map((m) => {
            const active = mode === m.key;
            return (
              <Pressable
                key={m.key}
                onPress={() => setMode(m.key)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  alignItems: 'center',
                  borderRadius: theme.radii.md,
                  borderWidth: 1.5,
                  borderColor: active ? theme.colors.primary : theme.colors.hairline,
                  backgroundColor: active ? theme.colors.primarySoft : theme.colors.surface2,
                }}
              >
                <Ionicons name={m.icon} size={18} color={active ? theme.colors.primary : theme.colors.textDim} />
                <Text style={{
                  marginTop: 4,
                  fontSize: 12,
                  fontWeight: active ? '700' : '500',
                  color: active ? theme.colors.primary : theme.colors.textDim,
                }}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {/* System settings */}
      <Card style={{ marginBottom: theme.spacing.lg }}>
        <Text style={[theme.typography.h3, { marginBottom: theme.spacing.md }]}>System settings</Text>
        <Text style={[theme.typography.small, { color: theme.colors.textDim, marginBottom: theme.spacing.sm }]}>Annual dues per student (per academic year)</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{
            flex: 1, flexDirection: 'row', alignItems: 'center',
            backgroundColor: theme.colors.surface2, borderRadius: theme.radii.md,
            paddingHorizontal: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.hairline, minHeight: 48,
          }}>
            <Text style={{ color: theme.colors.textDim, fontSize: 16, fontWeight: '600' }}>GH₵</Text>
            <TextInput
              value={duesAmount}
              onChangeText={setDuesAmount}
              keyboardType="numeric"
              placeholder="200"
              placeholderTextColor={theme.colors.textMuted}
              style={{ flex: 1, color: theme.colors.text, fontSize: 16, fontWeight: '600', marginLeft: 8 }}
            />
          </View>
          <Pressable
            onPress={saveDues}
            disabled={saving}
            style={{
              backgroundColor: saving ? theme.colors.textMuted : theme.colors.primary,
              paddingHorizontal: 20, paddingVertical: 12, borderRadius: theme.radii.md,
            }}
          >
            <Text style={{ color: '#00140D', fontWeight: '700', fontSize: 14 }}>{saving ? '...' : 'Save'}</Text>
          </Pressable>
        </View>
      </Card>

      <Card>
        <Text style={[theme.typography.h3, { marginBottom: theme.spacing.md }]}>Account details</Text>
        {[
          ['Email', user?.email],
          ['Role', user?.role?.replace('_', ' ')],
          ['Status', user?.status],
          ['Member since', user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'],
        ].map(([k, v]) => (
          <View key={k} style={{ paddingVertical: 10, borderTopColor: theme.colors.hairline, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={[theme.typography.small, { color: theme.colors.textDim }]}>{k}</Text>
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.text, textTransform: 'capitalize' }]}>{v || '—'}</Text>
          </View>
        ))}
      </Card>

      <View style={{ marginTop: theme.spacing.xxxl, gap: theme.spacing.md }}>
        <View>
          <Text style={{ color: theme.colors.danger, fontWeight: '700', fontSize: 16, textAlign: 'center' }} onPress={() => logout()}>Sign out</Text>
        </View>
        <Text style={{ color: theme.colors.textMuted, textAlign: 'center', fontSize: 12 }}>
          INFOTESS SDMS Admin · v1.0.0
        </Text>
      </View>
    </View>
  );
}
