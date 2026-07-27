import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider, useThemeContext } from '@/context/ThemeContext';

function RootNavigator() {
  const { theme, mode } = useThemeContext();
  return (
    <>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(student)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="admin/[student]" options={{ presentation: 'card', headerShown: false }} />
        <Stack.Screen name="admin/record-payment" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="admin/add-student" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="admin/scan" options={{ presentation: 'fullScreenModal', headerShown: false }} />
        <Stack.Screen name="admin/receipt" options={{ presentation: 'card', headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
