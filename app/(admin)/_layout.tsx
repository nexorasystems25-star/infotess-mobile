import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useThemeContext } from '@/context/ThemeContext';

export default function AdminTabs() {
  const { user, loading } = useAuth();
  const { theme } = useThemeContext();
  if (loading) return null;
  if (user && user.role === 'student') return <Redirect href="/(student)/home" />;
  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textDim,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.hairline,
          height: 64,
          paddingBottom: 8,
        },
        tabBarItemStyle: { paddingVertical: 8 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: 'Dashboard', tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="students"
        options={{ title: 'Students', tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="payments"
        options={{ title: 'Payments', tabBarIcon: ({ color, size }) => <Ionicons name="cash" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="proofs"
        options={{ title: 'Proofs', tabBarIcon: ({ color, size }) => <Ionicons name="document-text" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="reports"
        options={{ title: 'Reports', tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }}
      />
    </Tabs>
  );
}
