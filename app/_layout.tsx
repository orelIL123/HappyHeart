import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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
  // Skip useFonts when no custom fonts - avoids expo-font native module crash on iOS launch
  const fontsReady = true;

  return (
    <SafeAreaProvider>
      <AppProvider>
        <RootLayoutNav loaded={fontsReady} />
      </AppProvider>
    </SafeAreaProvider>
  );
}

function RootLayoutNav({ loaded }: { loaded: boolean }) {
  const { isAuthenticated, currentUser, isLoadingSession } = useApp();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const [updateChecked, setUpdateChecked] = useState(false);

  const safeHideSplash = async () => {
    try {
      await SplashScreen.hideAsync();
    } catch (error) {
      console.warn('SplashScreen.hideAsync skipped:', error);
    }
  };

  // Prevent the splash screen from auto-hiding before asset loading and session load are complete.
  useEffect(() => {
    if (loaded && !isLoadingSession) {
      safeHideSplash();
    }
  }, [loaded, isLoadingSession]);

  // Fallback: Hide splash screen after max 6 seconds to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('AppContext: Force hiding splash screen after timeout');
      safeHideSplash();
    }, 6000);

    return () => clearTimeout(timeout);
  }, []);

  // Check for updates - deferred to avoid triggering ErrorRecovery crash on iOS startup
  useEffect(() => {
    async function checkForUpdates() {
      try {
        if (__DEV__ || !Updates.isEnabled) {
          setUpdateChecked(true);
          return;
        }
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          try {
            await Updates.fetchUpdateAsync();
            if (Platform.OS === 'android') {
              setTimeout(() => Updates.reloadAsync(), 500);
            } else {
              Alert.alert(
                'עדכון הותקן!',
                'האפליקציה תתחיל מחדש כדי להחיל את העדכון.',
                [{ text: 'אישור', onPress: () => Updates.reloadAsync() }]
              );
            }
          } catch {
            setUpdateChecked(true);
          }
        } else {
          setUpdateChecked(true);
        }
      } catch {
        setUpdateChecked(true);
      }
    }

    if (!loaded || isLoadingSession || Platform.OS === 'ios') return;

    // Keep background update checks off on iOS until the launch crash issue is fully gone.
    const t = setTimeout(() => {
      checkForUpdates();
    }, 3000);

    const interval = setInterval(checkForUpdates, 30000);
    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, [loaded, isLoadingSession]);

  // Handle navigation based on auth state
  useEffect(() => {
    if (isLoadingSession || !loaded) {
      console.log('Navigation Effect - Waiting for load:', { isLoadingSession, loaded });
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const shouldShowAuth = !isAuthenticated;

    // Allow access to admin-cleanup, privacy and terms without authentication
    const currentPath = segments.join('/');
    if (currentPath === 'admin-cleanup' || currentPath === 'migrate-users' || currentPath === 'privacy' || currentPath === 'terms') {
      console.log('Navigation Effect - Allowing access to public tool/page');
      return;
    }

    console.log('Navigation Effect - shouldShowAuth:', shouldShowAuth, 'inAuthGroup:', inAuthGroup, 'currentUser:', currentUser?.name, 'isAuthenticated:', isAuthenticated);

    if (shouldShowAuth && !inAuthGroup) {
      console.log('Navigating to auth...');
      router.replace('/(auth)/login');
    } else if (!shouldShowAuth && inAuthGroup) {
      console.log('Navigating to tabs...');
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoadingSession, loaded, segments, currentUser, router]);

  if (!loaded) {
    return null;
  }

  if (isLoadingSession) {
    const colors = MyColors[colorScheme ?? 'light'];

    return (
      <ThemeProvider value={customTheme(theme, colorScheme)}>
        <View style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 24,
        }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{
            color: colors.text,
            fontSize: 17,
            fontWeight: '600',
            marginTop: 16,
            textAlign: 'center',
          }}>
            טוען את האפליקציה...
          </Text>
        </View>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={customTheme(theme, colorScheme)}>
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

function customTheme(theme: typeof DefaultTheme | typeof DarkTheme, colorScheme: 'light' | 'dark' | null | undefined) {
  return {
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
}
