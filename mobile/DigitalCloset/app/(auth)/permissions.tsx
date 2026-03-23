import React, { useState } from 'react';
import { StyleSheet, View, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useRouter } from 'expo-router';
// import * as Camera from 'expo-camera';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';

export default function PermissionsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  // const [cameraStatus, setCameraStatus] = useState<string | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);

  const primaryColor = useThemeColor({}, 'primary');
  const secondaryText = useThemeColor({}, 'secondaryText');
  const alternateColor = useThemeColor({}, 'alternate');

  const requestPermissions = async () => {
    setLoading(true);
    try {
      // const { status: camStatus } = await Camera.Camera.requestCameraPermissionsAsync();
      // setCameraStatus(camStatus);

      const { status: notifStatus } = await Notifications.requestPermissionsAsync();
      setNotificationStatus(notifStatus);

      // Even if they deny, we continue to the app
      router.replace('/');
    } catch (error) {
      console.error('Error requesting permissions:', error);
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>Permissions</ThemedText>
            <ThemedText style={[styles.subtitle, { color: secondaryText }]}>
              To give you the best experience, we need a few permissions.
            </ThemedText>
          </View>

          <View style={styles.permissionList}>
            {/* <View style={[styles.permissionItem, { borderColor: alternateColor }]}>
              <View style={[styles.iconContainer, { backgroundColor: alternateColor }]}>
                <Ionicons name="camera" size={24} color={primaryColor} />
              </View>
              <View style={styles.permissionText}>
                <ThemedText type="defaultSemiBold">Camera</ThemedText>
                <ThemedText style={[styles.description, { color: secondaryText }]}>
                  Used to snap photos of your outfits and identify clothing items.
                </ThemedText>
              </View>
            </View> */}

            <View style={[styles.permissionItem, { borderColor: alternateColor }]}>
              <View style={[styles.iconContainer, { backgroundColor: alternateColor }]}>
                <Ionicons name="notifications" size={24} color={primaryColor} />
              </View>
              <View style={styles.permissionText}>
                <ThemedText type="defaultSemiBold">Notifications</ThemedText>
                <ThemedText style={[styles.description, { color: secondaryText }]}>
                  Alerts you when your outfit photos have been processed.
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: primaryColor },
                pressed && styles.buttonPressed,
                loading && styles.buttonDisabled,
              ]}
              onPress={requestPermissions}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.buttonText}>Continue</ThemedText>
              )}
            </Pressable>
          </View>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  permissionList: {
    flex: 1,
    gap: 24,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    gap: 20,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionText: {
    flex: 1,
  },
  description: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  footer: {
    marginTop: 'auto',
  },
  button: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
