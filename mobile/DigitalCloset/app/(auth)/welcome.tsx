import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import * as Haptics from 'expo-haptics';

export default function WelcomeScreen() {
  const router = useRouter();
  
  const backgroundColor = useThemeColor({}, 'background');
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryTextColor = useThemeColor({}, 'secondaryText');
  const buttonTextColor = useThemeColor({}, 'background'); // Using background color for button text to contrast with primary

  const features = [
    {
      icon: 'camera-outline' as const,
      title: 'Snap photos of your outfits',
      description: 'No manual data entry. Just take a quick photo of what you wear.',
    },
    {
      icon: 'sparkles-outline' as const,
      title: 'AI automatically organizes',
      description: 'Our AI detects items, categorizes them, and matches them to your closet.',
    },
    {
      icon: 'bar-chart-outline' as const,
      title: 'Get insights on what you wear',
      description: 'Discover your most loved items and identify closet bloat effortlessly.',
    },
  ];

  return (
    <ThemedView style={[styles.safeArea, { backgroundColor }]}>
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <ThemedText type="title" style={styles.title}>
            Digital Closet
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: secondaryTextColor }]}>
            Your wardrobe, intelligently organized.
          </ThemedText>
        </View>

        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={[styles.iconContainer, { backgroundColor: primaryColor + '20' }]}>
                <Ionicons name={feature.icon} size={28} color={primaryColor} />
              </View>
              <View style={styles.featureTextContainer}>
                <ThemedText type="defaultSemiBold" style={styles.featureTitle}>
                  {feature.title}
                </ThemedText>
                <ThemedText style={[styles.featureDescription, { color: secondaryTextColor }]}>
                  {feature.description}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: primaryColor }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(auth)/login');
            }}
            activeOpacity={0.8}
          >
            <ThemedText style={[styles.buttonText, { color: buttonTextColor }]}>
              Get Started
            </ThemedText>
            <Ionicons name="arrow-forward" size={20} color={buttonTextColor} style={styles.buttonIcon} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  headerContainer: {
    paddingTop: 20,
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    lineHeight: 44,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 26,
  },
  featuresContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 17,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
  footerContainer: {
    marginBottom: 40,
    marginTop: 20,
  },
  button: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: 8,
  },
});
