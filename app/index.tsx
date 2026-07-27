import { Redirect, useRootNavigationState } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useThemeContext } from '@/context/ThemeContext';

export default function Index() {
  const { user, loading } = useAuth();
  const { theme } = useThemeContext();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.bg }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!user) return <Redirect href="/(auth)/login" />;

  if (user.role === 'student') return <Redirect href="/(student)/home" />;
  return <Redirect href="/(admin)/home" />;
}
