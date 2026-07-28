import { useState, useEffect } from 'react';
import { Text, View, Pressable, Alert, TextInput, ScrollView } from 'react-native';
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
  const [academicYear, setAcademicYear] = useState('');
  const [semester, setSemester] = useState('');
  const [memberSince, setMemberSince] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getSettings().then((r) => {
      if (r.settings.annual_dues_amount) setDuesAmount(r.settings.annual_dues_amount);
      if (r.settings.current_academic_year) setAcademicYear(r.settings.current_academic_year);
      if (r.settings.current_semester) setSemester(r.settings.current_semester);
      if (r.settings.org_member_since) setMemberSince(r.settings.org_member_since);
    }).catch(() => {});
  }, []);

  const refreshSettings = async () => {
    try {
      const r = await api.getSettings();
      if (r.settings.annual_dues_amount) setDuesAmount(r.settings.annual_dues_amount);
      if (r.settings.current_academic_year) setAcademicYear(r.settings.current_academic_year);
      if (r.settings.current_semester) setSemester(r.settings.current_semester);
      if (r.settings.org_member_since) setMemberSince(r.settings.org_member_since);
    } catch {}
  };

  const saveDues = async () => {
    const val = parseFloat(duesAmount);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Invalid amount', 'Enter a positive number for annual dues.');
      return;
    }
    setSaving(true);
    try {
      await api.updateSettings({ annual_dues_amount: val });
      await refreshSettings();
      Alert.alert('Saved', `Annual dues set to GH₵ ${val}`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const saveAcademic = async () => {
    if (!academicYear.trim()) {
      Alert.alert('Required', 'Enter the current academic year (e.g. 2026).');
      return;
    }
    if (!semester.trim()) {
      Alert.alert('Required', 'Select the current semester.');
      return;
    }
    setSaving(true);
    try {
      await api.updateSettings({ current_academic_year: academicYear.trim(), current_semester: semester.trim() });
      await refreshSettings();
      Alert.alert('Saved', `Academic year ${academicYear.trim()}, Semester ${semester.trim()}`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const saveMemberSince = async () => {
    if (!memberSince.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(memberSince.trim())) {
      Alert.alert('Invalid date', 'Enter a date in YYYY-MM-DD format.');
      return;
    }
    setSaving(true);
    try {
      await api.updateSettings({ org_member_since: memberSince.trim() });
      await refreshSettings();
      Alert.alert('Saved', 'Organization membership date updated.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const membershipYears = (() => {
    if (!memberSince) return null;
    const d = new Date(memberSince);
    if (isNaN(d.getTime())) return null;
    const now = new Date();
    const years = now.getFullYear() - d.getFullYear();
    const months = now.getMonth() - d.getMonth();
    if (years < 0) return null;
    if (years === 0) return `${months + 1} month${months + 1 !== 1 ? 's' : ''}`;
    return `${years} year${years !== 1 ? 's' : ''}`;
  })();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.bg }} contentContainerStyle={{ padding: theme.spacing.xxl }}>
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

        {/* Academic year + semester */}
        <Text style={[theme.typography.small, { color: theme.colors.textDim, marginBottom: theme.spacing.sm }]}>Current academic year</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: theme.spacing.md }}>
          <View style={{
            flex: 1, flexDirection: 'row', alignItems: 'center',
            backgroundColor: theme.colors.surface2, borderRadius: theme.radii.md,
            paddingHorizontal: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.hairline, minHeight: 48,
          }}>
            <Ionicons name="school" size={16} color={theme.colors.textDim} />
            <TextInput
              value={academicYear}
              onChangeText={setAcademicYear}
              placeholder="2026"
              placeholderTextColor={theme.colors.textMuted}
              style={{ flex: 1, color: theme.colors.text, fontSize: 16, fontWeight: '600', marginLeft: 8 }}
            />
          </View>
        </View>

        <Text style={[theme.typography.small, { color: theme.colors.textDim, marginBottom: theme.spacing.sm }]}>Current semester</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: theme.spacing.md }}>
          {['1', '2'].map((s) => {
            const active = semester === s;
            return (
              <Pressable
                key={s}
                onPress={() => setSemester(s)}
                style={{
                  flex: 1, paddingVertical: 12, alignItems: 'center',
                  borderRadius: theme.radii.md, borderWidth: 1.5,
                  borderColor: active ? theme.colors.primary : theme.colors.hairline,
                  backgroundColor: active ? theme.colors.primarySoft : theme.colors.surface2,
                  flexDirection: 'row', justifyContent: 'center', gap: 6,
                }}
              >
                <Ionicons name={s === '1' ? 'flag' : 'flag-outline'} size={16} color={active ? theme.colors.primary : theme.colors.textDim} />
                <Text style={{ fontSize: 14, fontWeight: active ? '700' : '500', color: active ? theme.colors.primary : theme.colors.textDim }}>
                  Semester {s}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={saveAcademic}
            disabled={saving}
            style={{
              backgroundColor: saving ? theme.colors.textMuted : theme.colors.primary,
              paddingHorizontal: 20, paddingVertical: 12, borderRadius: theme.radii.md,
            }}
          >
            <Text style={{ color: '#00140D', fontWeight: '700', fontSize: 14 }}>{saving ? '...' : 'Save'}</Text>
          </Pressable>
        </View>

        <View style={{ height: 1, backgroundColor: theme.colors.hairline, marginVertical: theme.spacing.md }} />

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
        ].map(([k, v]) => (
          <View key={k} style={{ paddingVertical: 10, borderTopColor: theme.colors.hairline, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={[theme.typography.small, { color: theme.colors.textDim }]}>{k}</Text>
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.text, textTransform: 'capitalize' }]}>{v || '—'}</Text>
          </View>
        ))}
        <View style={{ paddingVertical: 10, borderTopColor: theme.colors.hairline, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[theme.typography.small, { color: theme.colors.textDim }]}>Status</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' }} />
            <Text style={[theme.typography.bodyMedium, { color: '#22C55E', fontWeight: '600' }]}>Active</Text>
          </View>
        </View>
        <View style={{ paddingVertical: 10, borderTopColor: theme.colors.hairline, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[theme.typography.small, { color: theme.colors.textDim }]}>Member for</Text>
          <Text style={[theme.typography.bodyMedium, { color: theme.colors.text, fontWeight: '600' }]}>{membershipYears || '—'}</Text>
        </View>
      </Card>

      <Card style={{ marginTop: theme.spacing.lg }}>
        <Text style={[theme.typography.h3, { marginBottom: theme.spacing.md }]}>Organization</Text>
        <Text style={[theme.typography.small, { color: theme.colors.textDim, marginBottom: theme.spacing.sm }]}>Member since</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{
            flex: 1, flexDirection: 'row', alignItems: 'center',
            backgroundColor: theme.colors.surface2, borderRadius: theme.radii.md,
            paddingHorizontal: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.hairline, minHeight: 48,
          }}>
            <Ionicons name="calendar" size={16} color={theme.colors.textDim} />
            <TextInput
              value={memberSince}
              onChangeText={setMemberSince}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              style={{ flex: 1, color: theme.colors.text, fontSize: 16, fontWeight: '600', marginLeft: 8 }}
            />
          </View>
          <Pressable
            onPress={() => setMemberSince(new Date().toISOString().split('T')[0])}
            style={{
              backgroundColor: theme.colors.surface2, paddingHorizontal: 14, paddingVertical: 12, borderRadius: theme.radii.md,
              borderWidth: 1, borderColor: theme.colors.hairline,
            }}
          >
            <Text style={{ color: theme.colors.text, fontWeight: '600', fontSize: 13 }}>Today</Text>
          </Pressable>
          <Pressable
            onPress={saveMemberSince}
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

      <View style={{ marginTop: theme.spacing.xxxl, gap: theme.spacing.md }}>
        <View>
          <Text style={{ color: theme.colors.danger, fontWeight: '700', fontSize: 16, textAlign: 'center' }} onPress={() => logout()}>Sign out</Text>
        </View>
        <Text style={{ color: theme.colors.textMuted, textAlign: 'center', fontSize: 12 }}>
          INFOTESS SDMS Admin · v1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}
