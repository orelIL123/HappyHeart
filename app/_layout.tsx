import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
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
  const [updateChecked, setUpdateChecked] = useState(false);

  // Prevent the splash screen from auto-hiding before asset loading and session load are complete.
  useEffect(() => {
    if (loaded && !isLoadingSession) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isLoadingSession]);

  // Fallback: Hide splash screen after max 6 seconds to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('AppContext: Force hiding splash screen after timeout');
      SplashScreen.hideAsync();
    }, 6000);

    return () => clearTimeout(timeout);
  }, []);

  // Check for updates - Aggressive polling for fast updates
  useEffect(() => {
    async function checkForUpdates() {
      if (__DEV__ || !Updates.isEnabled) {
        console.log('Updates: Skipping check in dev mode or updates not enabled');
        setUpdateChecked(true);
        return;
      }

      try {
        console.log('Updates: Checking for updates...');
        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
          console.log('Updates: Update available! Auto-downloading...');
          try {
            await Updates.fetchUpdateAsync();
            console.log('Updates: Update downloaded! Reloading app...');
            // Automatically reload without asking on Android for faster updates
            if (Platform.OS === 'android') {
              setTimeout(() => {
                Updates.reloadAsync();
              }, 500);
            } else {
              Alert.alert(
                'עדכון הותקן!',
                'האפליקציה תתחיל מחדש כדי להחיל את העדכון.',
                [
                  {
                    text: 'אישור',
                    onPress: () => {
                      Updates.reloadAsync();
                    },
                  },
                ]
              );
            }
          } catch (error) {
            console.error('Updates: Error fetching update:', error);
            setUpdateChecked(true);
          }
        } else {
          console.log('Updates: No update available');
          setUpdateChecked(true);
        }
      } catch (error) {
        console.error('Updates: Error checking for updates:', error);
        setUpdateChecked(true);
      }
    }

    if (loaded && !isLoadingSession) {
      // Check immediately on load
      checkForUpdates();

      // Also check every 30 seconds for new updates (aggressive polling)
      const interval = setInterval(() => {
        checkForUpdates();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [loaded, isLoadingSession]);

  // Handle navigation based on auth state
  useEffect(() => {
    if (isLoadingSession || !loaded) {
      console.log('Navigation Effect - Waiting for load:', { isLoadingSession, loaded });
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const shouldShowAuth = !isAuthenticated && !isGuest;

    console.log('Navigation Effect - shouldShowAuth:', shouldShowAuth, 'inAuthGroup:', inAuthGroup, 'currentUser:', currentUser?.name, 'isAuthenticated:', isAuthenticated, 'isGuest:', isGuest);

    if (shouldShowAuth && !inAuthGroup) {
      console.log('Navigating to auth...');
      router.replace('/(auth)/login');
    } else if (!shouldShowAuth && inAuthGroup) {
      console.log('Navigating to tabs...');
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isGuest, isLoadingSession, loaded, segments, currentUser, router]);

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
