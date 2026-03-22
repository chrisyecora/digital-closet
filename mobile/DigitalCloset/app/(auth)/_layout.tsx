import { useAuth } from '@clerk/expo';
import { Redirect, Stack, useSegments } from 'expo-router';

export default function AuthRoutesLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const segments = useSegments();

  if (!isLoaded) {
    return null;
  }

  // If signed in and NOT on the permissions screen, redirect to home
  // This allows the permissions screen to be shown even if signed in
  const isPermissionsScreen = segments.some(s => (s as string) === 'permissions');
  if (isSignedIn && !isPermissionsScreen) {
    return <Redirect href="/" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
