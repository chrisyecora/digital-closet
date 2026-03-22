import React, { useState } from 'react';
import { StyleSheet, Pressable, View, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SignInForm } from '@/components/SignInForm';
import { SignUpForm } from '@/components/SignUpForm';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Stack } from 'expo-router';

export default function AuthHub() {
  const [isSignIn, setIsSignIn] = useState(true);

  const primaryColor = useThemeColor({}, 'primary');
  const alternateColor = useThemeColor({}, 'alternate');
  const secondaryBg = useThemeColor({}, 'secondary');
  const secondaryText = useThemeColor({}, 'secondaryText');

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Authentication', headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.mainTitle}>Digital Closet</ThemedText>
          <ThemedText style={[styles.subtitle, { color: secondaryText }]}>Your style, organized.</ThemedText>
        </View>

        <View style={styles.tabContainer}>
          <Pressable
            onPress={() => setIsSignIn(true)}
            style={[
              styles.tab,
              { borderBottomColor: isSignIn ? primaryColor : alternateColor },
              isSignIn && styles.activeTab
            ]}
          >
            <ThemedText 
              style={[
                styles.tabText, 
                { color: isSignIn ? primaryColor : alternateColor, fontWeight: isSignIn ? '700' : '400' }
              ]}
            >
              Sign In
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setIsSignIn(false)}
            style={[
              styles.tab,
              { borderBottomColor: !isSignIn ? primaryColor : alternateColor },
              !isSignIn && styles.activeTab
            ]}
          >
            <ThemedText 
              style={[
                styles.tabText, 
                { color: !isSignIn ? primaryColor : alternateColor, fontWeight: !isSignIn ? '700' : '400' }
              ]}
            >
              Sign Up
            </ThemedText>
          </Pressable>
        </View>

        <View style={[styles.formWrapper, { backgroundColor: secondaryBg }]}>
          {isSignIn ? <SignInForm /> : <SignUpForm />}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  mainTitle: {
    fontSize: 32,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
  },
  activeTab: {
    // Optional: add some background or elevation if needed
  },
  tabText: {
    fontSize: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  formWrapper: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
});
