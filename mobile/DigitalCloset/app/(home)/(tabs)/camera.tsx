import React, { useRef, useState } from 'react';
import { StyleSheet, View, Pressable, Linking, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Camera, 
  useCameraDevice, 
  useCameraPermission, 
  PhotoFile
} from 'react-native-vision-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function CameraScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { hasPermission, requestPermission } = useCameraPermission();
  const [photo, setPhoto] = useState<PhotoFile | { uri: string } | null>(null);
  const cameraRef = useRef<Camera>(null);

  // Explicitly select the physical wide-angle camera (1x)
  const device = useCameraDevice('back', {
    physicalDevices: ['wide-angle-camera']
  });

  const primaryColor = useThemeColor({}, 'primary');

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photoData = await cameraRef.current.takePhoto({
          flash: 'off',
          enableShutterSound: true,
        });
        setPhoto(photoData);
      } catch (e) {
        console.error('Failed to take picture:', e);
      }
    }
  };

  const pickImage = async () => {
    let currentPermission = await ImagePicker.getMediaLibraryPermissionsAsync();

    if (currentPermission.status === 'denied' && !currentPermission.canAskAgain) {
      Alert.alert(
        'Photo Library Access Required',
        'Please allow access to your photo library in settings to upload photos.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }

    if (!currentPermission.granted) {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhoto({ uri: result.assets[0].uri });
    }
  };

  const usePhoto = () => {
    if (photo) {
      const uri = 'path' in photo ? `file://${photo.path}` : photo.uri;
      console.log('Using photo:', uri);
      setPhoto(null);
      router.push({
        pathname: '/(home)/items/add',
        params: { photoUri: uri }
      });
    } else {
      setPhoto(null);
      router.navigate('/');
    }
  };

  const retakePhoto = () => {
    setPhoto(null);
  };

  if (!hasPermission) {
    return (
      <ThemedView style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color={primaryColor} />
        <ThemedText style={styles.permissionTitle}>
          Allow camera access
        </ThemedText>
        <ThemedText style={styles.permissionBody}>
          Digital Closet uses your camera to identify and track your clothing items.
        </ThemedText>
        
        <Pressable 
          style={[styles.primaryButton, { backgroundColor: primaryColor }]}
          onPress={async () => {
            const granted = await requestPermission();
            if (!granted) {
              Linking.openSettings();
            }
          }}
        >
          <ThemedText style={styles.buttonText}>
            Allow Camera Access
          </ThemedText>
        </Pressable>
        
        <Pressable 
          style={styles.secondaryButton}
          onPress={() => router.navigate('/')}
        >
          <ThemedText style={[styles.secondaryButtonText, { color: primaryColor }]}>
            Not Now
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  if (device == null) {
    return (
      <ThemedView style={styles.permissionContainer}>
        <ThemedText>No camera device found</ThemedText>
      </ThemedView>
    );
  }

  if (photo) {
    const photoUri = 'path' in photo ? `file://${photo.path}` : photo.uri;
    return (
      <View style={styles.container}>
        <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFillObject} />
        <SafeAreaView style={styles.overlayContainer} edges={['top', 'bottom']}>
          <View style={styles.previewTopBar}>
            <Pressable onPress={retakePhoto} style={styles.iconButton}>
              <Ionicons name="close" size={28} color="#fff" />
            </Pressable>
          </View>
          
          <View style={styles.previewBottomBar}>
            <Pressable style={styles.retakeButton} onPress={retakePhoto}>
              <ThemedText style={styles.retakeButtonText}>Retake</ThemedText>
            </Pressable>
            
            <Pressable 
              style={[styles.usePhotoButton, { backgroundColor: primaryColor }]} 
              onPress={usePhoto}
            >
              <ThemedText style={styles.usePhotoText}>Use Photo</ThemedText>
              <Ionicons name="checkmark" size={20} color="#fff" style={{ marginLeft: 8 }} />
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        device={device}
        isActive={isFocused}
        photo={true}
      />
      <SafeAreaView style={[styles.overlayContainer, StyleSheet.absoluteFillObject]} edges={['top', 'bottom']} pointerEvents="box-none">
        <View style={styles.cameraTopBar}>
          <Pressable onPress={() => router.navigate('/')} style={styles.iconButton}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
          <ThemedText style={styles.helperText}>
            Take a photo of your outfit today
          </ThemedText>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.cameraBottomBar}>
          <Pressable style={styles.libraryButton} onPress={pickImage}>
            <Ionicons name="images-outline" size={28} color="#fff" />
          </Pressable>
          
          <Pressable style={styles.captureButtonContainer} onPress={takePicture}>
            <View style={styles.captureButtonInner} />
          </Pressable>
          
          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionBody: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  overlayContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  cameraTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  previewTopBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helperText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cameraBottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  libraryButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 22,
  },
  captureButtonContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
  },
  previewBottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  retakeButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 30,
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  usePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  usePhotoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
