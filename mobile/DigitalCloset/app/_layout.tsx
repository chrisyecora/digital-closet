import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/expo';
import { tokenCache } from '@/lib/token-cache';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';

// Handle OAuth redirects
WebBrowser.maybeCompleteAuthSession();

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
      // Redirect to login if not signed in and not in auth group
      router.replace('/(auth)/login');
    } else if (isSignedIn && inAuthGroup) {
      // Redirect to home if signed in and in auth group
      router.replace('/');
    }
  }, [isSignedIn, isLoaded, segments]);

  if (!isLoaded) return null;

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <AuthGuard>
          <Slot />
        </AuthGuard>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
