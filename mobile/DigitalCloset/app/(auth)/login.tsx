import React, { useState } from 'react';
import { StyleSheet, Pressable, View, ScrollView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AuthForm } from '@/components/AuthForm';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Stack } from 'expo-router';

export default function AuthHub() {
  const [isSignIn, setIsSignIn] = useState(true);

  const primaryColor = useThemeColor({}, 'primary');
  const alternateColor = useThemeColor({}, 'alternate');
  const secondaryText = useThemeColor({}, 'secondaryText');

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Authentication', headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView 
              contentContainerStyle={styles.scrollContent} 
              bounces={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              <View style={styles.header}>
                <ThemedText type="title" style={styles.mainTitle}>Digital Closet</ThemedText>
                <ThemedText style={[styles.subtitle, { color: secondaryText }]}>Your style, organized.</ThemedText>
              </View>

              <View style={styles.tabContainer}>
                <Pressable
                  onPress={() => setIsSignIn(true)}
                  style={[
                    styles.tab,
                    { borderBottomColor: isSignIn ? primaryColor : alternateColor }
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
                    { borderBottomColor: !isSignIn ? primaryColor : alternateColor }
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

              <View style={styles.formWrapper}>
                <AuthForm isSignIn={isSignIn} />
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: '25%',
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  mainTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.6,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 40,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
  },
  activeTab: {
    // Handled dynamically
  },
  tabText: {
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  formWrapper: {
    flex: 1,
    marginTop: 20,
  },
});
