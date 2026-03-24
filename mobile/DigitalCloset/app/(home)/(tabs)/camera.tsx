import React, { useRef, useState } from 'react';
import { StyleSheet, View, Pressable, Linking, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  PhotoFile,
} from 'react-native-vision-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

const AnimatedImage = Animated.createAnimatedComponent(Image);

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

export default function CameraScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { hasPermission, requestPermission } = useCameraPermission();
  const [photo, setPhoto] = useState<PhotoFile | { uri: string } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const cameraRef = useRef<Camera>(null);
  const confettiRef = useRef<LottieView>(null);

  // Animation values
  const imageWidth = useSharedValue(windowWidth);
  const imageHeight = useSharedValue(windowHeight);
  const imageTop = useSharedValue(0);
  const imageLeft = useSharedValue(0);
  const imageBorderRadius = useSharedValue(0);
  const imageOpacity = useSharedValue(1);
  const overlayOpacity = useSharedValue(1);
  const successOverlayOpacity = useSharedValue(0);

  // Explicitly select the physical wide-angle camera (1x)
  const device = useCameraDevice('back', {
    physicalDevices: ['wide-angle-camera'],
  });

  const primaryColor = useThemeColor({}, 'primary');

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let currentPermission = await ImagePicker.getMediaLibraryPermissionsAsync();

    if (currentPermission.status === 'denied' && !currentPermission.canAskAgain) {
      Alert.alert(
        'Photo Library Access Required',
        'Please allow access to your photo library in settings to upload photos.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsAnimating(true);

      // Target values for the camera tab icon (approximate position)
      const targetWidth = 56;
      const targetHeight = 56;
      const targetLeft = windowWidth / 2 - targetWidth / 2;
      const targetTop = windowHeight - 90;

      overlayOpacity.value = withTiming(0, { duration: 200 });
      successOverlayOpacity.value = withTiming(1, { duration: 300 });

      // Trigger confetti
      confettiRef.current?.play();

      // Reset image animation values to full screen before starting genie animation
      imageWidth.value = windowWidth;
      imageHeight.value = windowHeight;
      imageTop.value = 0;
      imageLeft.value = 0;
      imageBorderRadius.value = 0;
      imageOpacity.value = 1;

      // Animate the image shrinking down into the tab bar camera icon
      imageWidth.value = withTiming(targetWidth, { duration: 600 });
      imageHeight.value = withTiming(targetHeight, { duration: 600 });
      imageTop.value = withTiming(targetTop, { duration: 600 });
      imageLeft.value = withTiming(targetLeft, { duration: 600 });
      imageBorderRadius.value = withTiming(targetWidth / 2, { duration: 600 });
      imageOpacity.value = withSequence(
        withTiming(1, { duration: 400 }), 
        withTiming(0, { duration: 200 }),
      );

      // Once the animation and confetti conclude, reset the state and navigate home
      setTimeout(() => {
        setPhoto(null);
        setIsAnimating(false);
        // Reset animation values for the next time
        imageWidth.value = windowWidth;
        imageHeight.value = windowHeight;
        imageTop.value = 0;
        imageLeft.value = 0;
        imageBorderRadius.value = 0;
        imageOpacity.value = 1;
        overlayOpacity.value = 1;
        successOverlayOpacity.value = 0;

        router.replace('/');
      }, 3000);
    } else {
      setPhoto(null);
      router.replace('/');
    }
  };

  const retakePhoto = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhoto(null);
  };

  const animatedImageStyle = useAnimatedStyle(() => {
    return {
      width: imageWidth.value,
      height: imageHeight.value,
      top: imageTop.value,
      left: imageLeft.value,
      borderRadius: imageBorderRadius.value,
      opacity: imageOpacity.value,
      position: 'absolute',
      overflow: 'hidden',
    };
  });

  const animatedOverlayStyle = useAnimatedStyle(() => {
    return {
      opacity: overlayOpacity.value,
    };
  });

  const animatedSuccessOverlayStyle = useAnimatedStyle(() => {
    return {
      opacity: successOverlayOpacity.value,
      zIndex: 10,
    };
  });

  if (!hasPermission) {
    return (
      <ThemedView style={styles.permissionContainer}>
        <Ionicons name='camera-outline' size={64} color={primaryColor} />
        <ThemedText style={styles.permissionTitle}>Allow camera access</ThemedText>
        <ThemedText style={styles.permissionBody}>
          Digital Closet uses your camera to identify and track your clothing items.
        </ThemedText>

        <Pressable
          style={[styles.primaryButton, { backgroundColor: primaryColor }]}
          onPress={async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const granted = await requestPermission();
            if (!granted) {
              Linking.openSettings();
            }
          }}
        >
          <ThemedText style={styles.buttonText}>Allow Camera Access</ThemedText>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.navigate('/');
          }}
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

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        device={device}
        isActive={isFocused}
        photo={true}
        photoQualityBalance='speed'
      />

      {photo && (
        <View style={StyleSheet.absoluteFill}>
          <AnimatedImage
            source={{ uri: 'path' in photo ? `file://${photo.path}` : photo.uri }}
            style={[styles.absoluteFillObject, animatedImageStyle]}
          />
          <Animated.View
            style={[StyleSheet.absoluteFillObject, animatedOverlayStyle]}
            pointerEvents='box-none'
          >
            <SafeAreaView style={styles.overlayContainer} edges={['top', 'bottom']}>
              <View style={styles.previewTopBar}>
                <Pressable onPress={retakePhoto} style={styles.iconButton}>
                  <Ionicons name='close' size={28} color='#fff' />
                </Pressable>
              </View>

              <View style={styles.previewBottomBar}>
                <Pressable style={styles.retakeButton} onPress={retakePhoto}>
                  <ThemedText style={styles.retakeButtonText}>Retake</ThemedText>
                </Pressable>

                <Pressable
                  style={[styles.usePhotoButton, { backgroundColor: primaryColor }]}
                  onPress={usePhoto}
                  disabled={isAnimating}
                >
                  <ThemedText style={styles.usePhotoText}>Use Photo</ThemedText>
                  <Ionicons name='checkmark' size={20} color='#fff' style={{ marginLeft: 8 }} />
                </Pressable>
              </View>
            </SafeAreaView>
          </Animated.View>

          {/* Success Overlay with Confetti */}
          <Animated.View
            style={[styles.absoluteFillObject, styles.successOverlay, animatedSuccessOverlayStyle]}
            pointerEvents='none'
          >
            <BlurView intensity={20} tint='extraLight' style={StyleSheet.absoluteFill} />
            <LottieView
              ref={confettiRef}
              source={require('@/assets/animations/confetti.json')}
              autoPlay={false}
              loop={false}
              style={styles.confetti}
            />
            <View style={styles.successMessageContainer}>
              <ThemedText style={styles.successMessageEmoji}>🎉</ThemedText>
              <ThemedText style={styles.successMessageTitle}>Submitted!</ThemedText>
              <ThemedText style={styles.successMessageBody}>
                Our AI is working its magic to identify and catalog your fit!
              </ThemedText>
            </View>
          </Animated.View>
        </View>
      )}

      {!photo && (
        <SafeAreaView
          style={[styles.overlayContainer, StyleSheet.absoluteFillObject]}
          edges={['top', 'bottom']}
          pointerEvents='box-none'
        >
          <View style={styles.cameraTopBar}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.replace('/');
              }}
              style={styles.iconButton}
            >
              <Ionicons name='close' size={28} color='#fff' />
            </Pressable>
            <ThemedText style={styles.helperText}>Take a photo of your outfit today</ThemedText>
            <View style={{ width: 44 }} />
          </View>

          <View style={styles.cameraBottomBar}>
            <Pressable style={styles.libraryButton} onPress={pickImage}>
              <Ionicons name='images-outline' size={28} color='#fff' />
            </Pressable>

            <Pressable style={styles.captureButtonContainer} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </Pressable>

            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      )}
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
  absoluteFillObject: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
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
  successOverlay: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  confetti: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    pointerEvents: 'none',
  },
  successMessageContainer: {
    padding: 30,
    paddingTop: 50,
    borderRadius: 16,
    alignItems: 'center',
    zIndex: 20,
  },
  successMessageTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
    lineHeight: 28,
  },
  successMessageEmoji: {
    fontSize: 28,
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
    paddingTop: 10,
    backgroundColor: 'transparent',
  },
  successMessageBody: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 300,
  },
});
