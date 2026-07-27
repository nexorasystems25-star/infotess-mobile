import { useState, useCallback } from 'react';
import { FlatList, RefreshControl, View, Text, TextInput, LayoutAnimation, Platform, UIManager, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { api, ApiError } from '@/services/api';
import { Student } from '@/types';
import { Card, GhostButton } from '@/components/ui';
import { useThemeContext } from '@/context/ThemeContext';

if (Platform.OS === 'android') UIManager.setLayoutAnimationEnabledExperimental?.(true);

export default function AdminStudents() {
  const router = useRouter();
  const { theme } = useThemeContext();
  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = async (q?: string, p?: number) => {
    const searchQ = q !== undefined ? q : query;
    const searchPage = p !== undefined ? p : page;
    setRefreshing(true);
    try {
      const r = await api.students(searchQ, searchPage);
      setStudents(r.students);
      setTotal(r.total);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load students');
    } finally { setRefreshing(false); setLoading(false); }
  };

  useFocusEffect(
    useCallback(() => {
      load('', 1);
      setPage(1);
    }, [])
  );

  const onSearch = () => { setPage(1); load(query, 1); };

  const toggleExpand = (id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.create(
      200,
      LayoutAnimation.Types.easeInEaseOut,
      LayoutAnimation.Properties.opacity,
    ));
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      {/* Header */}
      <View style={{ padding: theme.spacing.xxl, paddingBottom: theme.spacing.md }}>
        <Text style={theme.typography.h1}>Students</Text>
        <Text style={[theme.typography.body, { color: theme.colors.textDim, marginTop: 4 }]}>
          {total} registered student{total === 1 ? '' : 's'}
        </Text>
      </View>

      {/* Search bar */}
      <View style={{ paddingHorizontal: theme.spacing.xxl, marginBottom: theme.spacing.lg }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: theme.colors.surface2, borderRadius: theme.radii.md,
          paddingHorizontal: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.hairline, gap: 8,
        }}>
          <Ionicons name="search" size={18} color={theme.colors.textDim} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={onSearch}
            placeholder="Search name or index number..."
            placeholderTextColor={theme.colors.textMuted}
            style={{ flex: 1, color: theme.colors.text, fontSize: 15, paddingVertical: 14 }}
          />
          {query ? (
            <Ionicons name="close-circle" size={18} color={theme.colors.textMuted}
              onTouchEnd={() => { setQuery(''); load('', 1); }} />
          ) : null}
        </View>
      </View>

      {error ? (
        <View style={{ paddingHorizontal: theme.spacing.xxl }}>
          <Card style={{ borderColor: theme.colors.danger }}>
            <Text style={{ color: theme.colors.danger }}>{error}</Text>
          </Card>
        </View>
      ) : null}

      <FlatList
        data={students}
        keyExtractor={(i) => String(i.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load()} tintColor={theme.colors.primary} />}
        contentContainerStyle={{ padding: theme.spacing.xxl, paddingBottom: theme.spacing.huge * 2 }}
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
        ListEmptyComponent={
          !loading ? (
            <View style={{ marginTop: 60, alignItems: 'center' }}>
              <Ionicons name="people-outline" size={48} color={theme.colors.textMuted} />
              <Text style={{ color: theme.colors.textDim, marginTop: 12, fontSize: 15 }}>
                {query ? 'No students match your search.' : 'No students yet.'}
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          total > 20 ? (
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: theme.spacing.md, marginTop: theme.spacing.xl }}>
              <GhostButton title="← Previous" onPress={() => { if (page > 1) { setPage(page - 1); load(query, page - 1); } }} />
              <Text style={{ color: theme.colors.textDim, alignSelf: 'center', fontSize: 14 }}>Page {page}</Text>
              <GhostButton title="Next →" onPress={() => { setPage(page + 1); load(query, page + 1); }} />
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const expanded = expandedId === item.id;
          return (
            <Card elevation="soft">
              {/* Compact row — always visible */}
              <Pressable
                onPress={() => toggleExpand(item.id)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}
              >
                <View style={{
                  width: 44, height: 44, borderRadius: 14,
                  backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1, borderColor: theme.colors.primary,
                }}>
                  <Ionicons name="person" size={20} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[theme.typography.bodyMedium, { color: theme.colors.text }]}>{item.full_name}</Text>
                  <Text style={[theme.typography.small, { color: theme.colors.textDim, marginTop: 2 }]}>
                    {item.index_number} · {item.department} — Lvl {item.level}
                  </Text>
                </View>
                <Ionicons
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={theme.colors.textMuted}
                />
              </Pressable>

              {/* Expanded details */}
              {expanded ? (
                <View style={{ marginTop: theme.spacing.md, paddingTop: theme.spacing.md, borderTopWidth: 1, borderTopColor: theme.colors.hairline }}>
                  {item.email ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Ionicons name="mail-outline" size={14} color={theme.colors.secondary} />
                      <Text style={[theme.typography.small, { color: theme.colors.text }]}>{item.email}</Text>
                    </View>
                  ) : null}
                  {item.phone_number ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Ionicons name="call-outline" size={14} color={theme.colors.textDim} />
                      <Text style={[theme.typography.small, { color: theme.colors.text }]}>{item.phone_number}</Text>
                    </View>
                  ) : null}
                  {item.created_at ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <Ionicons name="calendar-outline" size={14} color={theme.colors.textMuted} />
                      <Text style={[theme.typography.small, { color: theme.colors.textDim }]}>
                        Registered {new Date(item.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  ) : null}
                  <Pressable
                    onPress={() => router.push(`/admin/${item.id}`)}
                    style={{
                      backgroundColor: theme.colors.primary,
                      paddingVertical: 10, paddingHorizontal: 16,
                      borderRadius: theme.radii.md, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6,
                    }}
                  >
                    <Ionicons name="eye-outline" size={16} color="#00140D" />
                    <Text style={{ color: '#00140D', fontWeight: '700', fontSize: 14 }}>View payment history</Text>
                  </Pressable>
                </View>
              ) : null}
            </Card>
          );
        }}
      />
    </View>
  );
}
