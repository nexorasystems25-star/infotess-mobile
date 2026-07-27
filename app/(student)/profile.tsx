import { Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/context/AuthContext';
import { useThemeContext } from '@/context/ThemeContext';
import { Card } from '@/components/ui';

const MODES = [
  { key: 'dark' as const, label: 'Dark', icon: 'moon' as const },
  { key: 'light' as const, label: 'Light', icon: 'sunny' as const },
  { key: 'system' as const, label: 'System', icon: 'phone-portrait' as const },
];

export default function StudentProfile() {
  const { user, student, logout } = useAuth();
  const { theme, mode, setMode } = useThemeContext();

  const Rows: [string, string | undefined | null][] = [
    ['Full name', student?.full_name],
    ['Index number', student?.index_number],
    ['Department', student?.department],
    ['Level', student?.level],
    ['Phone', student?.phone_number],
    ['Email', user?.email],
    ['Account type', 'Student'],
  ].filter(([_, v]) => Boolean(v)) as any;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, padding: theme.spacing.xxl }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: theme.spacing.xxl }}>
        <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.primary }}>
          <Ionicons name="person" color={theme.colors.primary} size={30} />
        </View>
        <View>
          <Text style={theme.typography.h2}>{student?.full_name || 'Student'}</Text>
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

      <Card>
        <Text style={[theme.typography.h3, { marginBottom: theme.spacing.md }]}>Profile information</Text>
        {Rows.map(([k, v]) => (
          <View key={k} style={{ paddingVertical: 10, borderTopColor: theme.colors.hairline, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={[theme.typography.small, { color: theme.colors.textDim }]}>{k}</Text>
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.text }]}>{v}</Text>
          </View>
        ))}
      </Card>

      <View style={{ marginTop: theme.spacing.xxxl, gap: theme.spacing.md }}>
        <View>
          <Text style={{ color: theme.colors.danger, fontWeight: '700', fontSize: 16, textAlign: 'center' }} onPress={() => logout()}>Sign out</Text>
        </View>
        <Text style={{ color: theme.colors.textMuted, textAlign: 'center', fontSize: 12 }}>
          INFOTESS SDMS · v1.0.0 — For assistance, contact the IT Society executives.
        </Text>
      </View>
    </View>
  );
}
