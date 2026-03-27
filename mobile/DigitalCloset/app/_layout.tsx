import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/expo';
import { tokenCache } from '@/lib/token-cache';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/theme/theme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Handle OAuth redirects
WebBrowser.maybeCompleteAuthSession();

const queryClient = new QueryClient();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error('Add your Clerk Publishable Key to the .env file');
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isSignedIn && !inAuthGroup) {
      // Redirect to welcome if not signed in and not in auth group
      router.replace('/(auth)/welcome');
    } else if (isSignedIn && inAuthGroup) {
      // Redirect to home if signed in and in auth group, 
      // EXCEPT when we are on the permissions screen
      const isPermissionsScreen = segments[segments.length - 1] === 'permissions';
      if (!isPermissionsScreen) {
        router.replace('/');
      }
    }
  }, [isSignedIn, isLoaded, segments, router]);

  if (!isLoaded) return null;

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  const backgroundColor = colorScheme === 'dark' ? Colors.dark.background : Colors.light.background;

  useEffect(() => {
    // Ensure the root native view background matches our theme
    // This prevents white/black flashes and invisible banners at screen edges
    SystemUI.setBackgroundColorAsync(backgroundColor);
  }, [backgroundColor]);

  const customLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: backgroundColor,
    },
  };

  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: backgroundColor,
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <ClerkLoaded>
          <QueryClientProvider client={queryClient}>
            <KeyboardProvider>
              <BottomSheetModalProvider>
                <SafeAreaProvider>
                  <ThemeProvider value={colorScheme === 'dark' ? customDarkTheme : customLightTheme}>
                    <AuthGuard>
                      <Slot />
                    </AuthGuard>
                    <StatusBar style="auto" />
                  </ThemeProvider>
                </SafeAreaProvider>
              </BottomSheetModalProvider>
            </KeyboardProvider>
          </QueryClientProvider>
        </ClerkLoaded>
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}
