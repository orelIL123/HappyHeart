import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { NotificationCenter } from '@/components/NotificationCenter';
import { Sidebar } from '@/components/Sidebar';
import { useColorScheme } from '@/components/useColorScheme';
import MyColors from '@/constants/Colors';
import { AppProvider, useApp } from '@/context/AppContext';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // You can add custom fonts here if needed
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  return (
    <AppProvider>
      <RootLayoutNav loaded={loaded} />
    </AppProvider>
  );
}

function RootLayoutNav({ loaded }: { loaded: boolean }) {
  const { isAuthenticated, isGuest, currentUser, isLoadingSession } = useApp();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  // Prevent the splash screen from auto-hiding before asset loading and session load are complete.
  useEffect(() => {
    if (loaded && !isLoadingSession) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isLoadingSession]);

  // Handle navigation based on auth state
  useEffect(() => {
    if (isLoadingSession || !loaded) return;

    const inAuthGroup = segments[0] === '(auth)';
    const shouldShowAuth = !isAuthenticated && !isGuest;

    console.log('Navigation Effect - shouldShowAuth:', shouldShowAuth, 'inAuthGroup:', inAuthGroup, 'currentUser:', currentUser?.name);

    if (shouldShowAuth && !inAuthGroup) {
      console.log('Navigating to auth...');
      router.replace('/(auth)/login');
    } else if (!shouldShowAuth && inAuthGroup) {
      console.log('Navigating to tabs...');
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isGuest, isLoadingSession, loaded, segments]);

  if (!loaded || isLoadingSession) {
    return null;
  }

  const customTheme = {
    ...theme,
    colors: {
      ...theme.colors,
      primary: MyColors[colorScheme ?? 'light'].primary,
      background: MyColors[colorScheme ?? 'light'].background,
      card: MyColors[colorScheme ?? 'light'].card,
      text: MyColors[colorScheme ?? 'light'].text,
      border: MyColors[colorScheme ?? 'light'].border,
    }
  };

  return (
    <ThemeProvider value={customTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <Sidebar />
      <NotificationCenter />
    </ThemeProvider>
  );
}
