import React from 'react';
import { Text, View, TextInput, ViewProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '@/context/ThemeContext';

function useT() {
  return useThemeContext().theme;
}

export function Card({ children, style, elevation }: { children: React.ReactNode; style?: any; elevation?: 'card' | 'soft' }) {
  const theme = useT();
  const shadow = elevation === 'soft' ? theme.shadows.soft : theme.shadows.card;
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radii.lg,
          padding: theme.spacing.lg,
          borderWidth: 1,
          borderColor: theme.colors.hairline,
          ...shadow,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: string }) {
  const theme = useT();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: theme.spacing.md }}>
      <Text style={{ ...theme.typography.h3, color: theme.colors.text }}>{title}</Text>
      {action ? <Text style={{ ...theme.typography.small, color: theme.colors.secondary }}>{action}</Text> : null}
    </View>
  );
}

export function Stat({
  label,
  value,
  delta,
  icon,
  tone = 'primary',
}: {
  label: string;
  value: string;
  delta?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: 'primary' | 'danger' | 'accent' | 'secondary';
}) {
  const theme = useT();
  const toneColor = {
    primary: theme.colors.primary,
    danger: theme.colors.danger,
    accent: theme.colors.accent,
    secondary: theme.colors.secondary,
  }[tone];
  return (
    <Card elevation="soft" style={{ flex: 1, minHeight: 110 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {icon ? (
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: `${toneColor}1A`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={icon} size={20} color={toneColor} />
          </View>
        ) : <View />}
        {delta ? (
          <Text style={[theme.typography.small, { color: theme.colors.primary, fontWeight: '700' }]}>{delta}</Text>
        ) : null}
      </View>
      <Text style={[theme.typography.h1, { color: theme.colors.text, marginTop: theme.spacing.md }]}>{value}</Text>
      <Text style={[theme.typography.small, { color: theme.colors.textDim, marginTop: 2 }]}>{label}</Text>
    </Card>
  );
}

export function Badge({ label, tone = 'primary' }: { label: string; tone?: 'primary' | 'danger' | 'accent' | 'muted' }) {
  const theme = useT();
  const map = {
    primary: { bg: `${theme.colors.primary}1A`, fg: theme.colors.primary },
    danger: { bg: `${theme.colors.danger}1A`, fg: theme.colors.danger },
    accent: { bg: `${theme.colors.accent}1A`, fg: theme.colors.accent },
    muted: { bg: `${theme.colors.textMuted}1A`, fg: theme.colors.textDim },
  }[tone];
  return (
    <View style={{ flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radii.pill, backgroundColor: map.bg, alignSelf: 'flex-start' }}>
      <Text style={[theme.typography.small, { color: map.fg, fontWeight: '600' }]}>{label}</Text>
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
  icon,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const theme = useT();
  return (
    <View
      style={{
        backgroundColor: disabled || loading ? theme.colors.textMuted : theme.colors.primary,
        paddingVertical: theme.spacing.md + 2,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.radii.lg,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        opacity: disabled ? 0.6 : 1,
        minHeight: 52,
      }}
      onTouchEnd={(e) => { if (e.persist) e.persist(); if (!loading && !disabled) onPress(); }}
    >
      {icon ? <Ionicons name={icon} size={18} color={'#00140D'} /> : null}
      <Text style={{ color: '#00140D', fontWeight: '700', fontSize: 16 }}>{loading ? 'Working…' : title}</Text>
    </View>
  );
}

export function GhostButton({
  title,
  onPress,
  icon,
}: {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const theme = useT();
  return (
    <View
      style={{
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.radii.lg,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: theme.colors.hairline,
        minHeight: 52,
      }}
      onTouchEnd={(e) => { if (e.persist) e.persist(); onPress(); }}
    >
      {icon ? <Ionicons name={icon} size={18} color={theme.colors.text} /> : null}
      <Text style={{ color: theme.colors.text, fontWeight: '600', fontSize: 16 }}>{title}</Text>
    </View>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secure,
  keyboardType = 'default',
  autoCapitalize = 'none',
  icon,
}: {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secure?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const theme = useT();
  return (
    <View style={{ marginBottom: theme.spacing.md }}>
      {label ? <Text style={[theme.typography.small, { color: theme.colors.textDim, marginBottom: theme.spacing.xs }]}>{label}</Text> : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.colors.surface2,
          borderRadius: theme.radii.md,
          paddingHorizontal: theme.spacing.md,
          borderWidth: 1,
          borderColor: theme.colors.hairline,
          minHeight: 52,
          gap: 8,
        }}
      >
        {icon ? <Ionicons name={icon} size={18} color={theme.colors.textDim} /> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry={secure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={{ flex: 1, color: theme.colors.text, fontSize: 16, fontWeight: '500' }}
        />
      </View>
    </View>
  );
}
