import React from 'react';
import { StyleSheet, View, Image, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function AddItemScreen() {
  const { photoUri } = useLocalSearchParams<{ photoUri: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = React.useState(false);
  
  const backgroundColor = useThemeColor({}, 'background');
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryText = useThemeColor({}, 'secondaryText');

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleUpload = async () => {
    if (!photoUri) return;
    
    setLoading(true);
    // Simulate upload delay
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        "Item Uploaded!",
        "Your item has been uploaded and will be processed by the ML engine.",
        [{ text: "OK", onPress: () => router.navigate('/(home)/(tabs)/closet') }]
      );
    }, 1500);
  };

  if (!photoUri) {
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <ThemedText>No photo selected.</ThemedText>
        <Pressable onPress={handleGoBack} style={{ marginTop: 20 }}>
          <ThemedText style={{ color: primaryColor }}>Go Back</ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: photoUri }} style={styles.heroImage} />
      </View>

      <View style={styles.contentContainer}>
        <ThemedText type="title" style={styles.title}>Upload Item</ThemedText>
        
        <ThemedText style={[styles.description, { color: secondaryText }]}>
          Our ML model will automatically detect the category, color, and remove the background.
        </ThemedText>

        <Pressable 
          style={[styles.uploadButton, { backgroundColor: primaryColor }]}
          onPress={handleUpload}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <ThemedText style={styles.uploadButtonText}>Analyze & Add to Closet</ThemedText>
              <Ionicons name="sparkles" size={20} color="#fff" style={{ marginLeft: 8 }} />
            </>
          )}
        </Pressable>
      </View>

      <Pressable 
        style={[styles.backButton, { top: insets.top + 10 }]} 
        onPress={handleGoBack}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <View style={styles.backButtonBg}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 400,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
  },
  backButtonBg: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: 24,
    flex: 1,
  },
  title: {
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 'auto',
    marginBottom: 20,
  },
  uploadButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
