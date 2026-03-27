import { ThemedText } from '@/components/themed-text';
import { useSignIn, useSignUp, useOAuth, useClerk } from '@clerk/expo';
import { useRouter } from 'expo-router';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Pressable, StyleSheet, TextInput, View, ActivityIndicator, Platform } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';

interface AuthFormProps {
  isSignIn: boolean;
}

export function AuthForm({ isSignIn }: AuthFormProps) {
  const router = useRouter();
  const clerk = useClerk();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();

  const { startOAuthFlow: startGoogleOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startAppleOAuthFlow } = useOAuth({ strategy: 'oauth_apple' });

  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const codeInputRef = useRef<TextInput>(null);

  // Warm up the browser for faster OAuth on Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      void WebBrowser.warmUpAsync();
      return () => {
        void WebBrowser.coolDownAsync();
      };
    }
  }, []);

  // Auto-focus logic
  useEffect(() => {
    const isVerifying = isSignIn
      ? signIn?.status === 'needs_client_trust' || signIn?.status === 'needs_second_factor'
      : signUp?.status === 'missing_requirements' &&
        signUp?.unverifiedFields.includes('email_address');

    const timer = setTimeout(() => {
      if (isVerifying) {
        codeInputRef.current?.focus();
      } else {
        emailInputRef.current?.focus();
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [isSignIn, signIn?.status, signUp?.status, signUp?.unverifiedFields]);

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const primaryColor = useThemeColor({}, 'primary');
  const textColor = useThemeColor({}, 'text');
  const secondaryText = useThemeColor({}, 'secondaryText');
  const actionText = useThemeColor({}, 'actionText');
  const errorColor = useThemeColor({}, 'error');
  const alternateColor = useThemeColor({}, 'alternate');

  const onAuthSuccess = useCallback(async (sessionId: string) => {
    if (clerk.setActive) {
      try {
//         const { status: cameraStatus } = await Camera.Camera.getCameraPermissionsAsync();
        const { status: notifStatus } = await Notifications.getPermissionsAsync();

        // If either permission is undetermined (we haven't asked), show permissions screen
        if (notifStatus === 'undetermined') {
          router.replace('/(auth)/permissions');
        } else {
          // Already asked for both, go to home
          router.replace('/');
        }
      } catch (error) {
        console.error('Error checking permissions:', error);
        router.replace('/');
      } finally {
        await clerk.setActive({ session: sessionId });
      }
    }
  }, [router, clerk]);

  const handleOAuth = async (strategy: 'google' | 'apple') => {
    setIsLoading(true);
    setError(null);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const startFlow = strategy === 'google' ? startGoogleOAuthFlow : startAppleOAuthFlow;
      const { createdSessionId } = await startFlow();

      if (createdSessionId) {
        await onAuthSuccess(createdSessionId);
      }
    } catch (err: any) {
      console.error('OAuth error:', err);
      setError(err.errors?.[0]?.message || 'An error occurred during OAuth');
    } finally {
      setIsLoading(false);
    }
  };

  // Sign In Logic
  const handleSignIn = async () => {
    if (!signIn) return;
    setIsLoading(true);
    setError(null);
    try {
      const { error: signInError } = await signIn.password({
        identifier: emailAddress,
        password,
      });

      if (signInError) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError(signInError.message);
        return;
      }

      if (signIn.status === 'complete') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (signIn.createdSessionId) await onAuthSuccess(signIn.createdSessionId);
      } else if (signIn.status === 'needs_second_factor' || signIn.status === 'needs_client_trust') {
        const { error: sendError } = await signIn.mfa.sendEmailCode();
        if (sendError) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setError(sendError.message);
          return;
        }
      }
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error(JSON.stringify(err, null, 2));
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInVerify = async () => {
    if (!signIn) return;
    setIsLoading(true);
    setError(null);
    try {
      const { error: verifyError } = await signIn.mfa.verifyEmailCode({
        code,
      });

      if (verifyError) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError(verifyError.message);
        return;
      }

      if (signIn.status === 'complete') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (signIn.createdSessionId) await onAuthSuccess(signIn.createdSessionId);
      }
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error(JSON.stringify(err, null, 2));
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Sign Up Logic
  const handleSignUp = async () => {
    if (!signUp) return;
    setIsLoading(true);
    setError(null);
    try {
      const { error: signUpError } = await signUp.password({
        emailAddress,
        password,
      });

      if (signUpError) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError(signUpError.message);
        return;
      }

      const { error: sendError } = await signUp.verifications.sendEmailCode();
      if (sendError) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError(sendError.message);
        return;
      }
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error(JSON.stringify(err, null, 2));
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpVerify = async () => {
    if (!signUp) return;
    setIsLoading(true);
    setError(null);
    try {
      const { error: verifyError } = await signUp.verifications.verifyEmailCode({
        code,
      });

      if (verifyError) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError(verifyError.message);
        return;
      }

      if (signUp.status === 'complete') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (signUp.createdSessionId) await onAuthSuccess(signUp.createdSessionId);
      }
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error(JSON.stringify(err, null, 2));
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSignIn) {
      handleSignIn();
    } else {
      handleSignUp();
    }
  };
  const handleVerify = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSignIn) {
      handleSignInVerify();
    } else {
      handleSignUpVerify();
    }
  };
  const handleResend = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError(null);
    try {
      if (isSignIn) {
        const result = await signIn?.mfa.sendEmailCode();
        if (result?.error) setError(result.error.message);
      } else {
        const result = await signUp?.verifications.sendEmailCode();
        if (result?.error) setError(result.error.message);
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Failed to resend code');
    }
  };

  const isVerifying = isSignIn
    ? signIn?.status === 'needs_client_trust' || signIn?.status === 'needs_second_factor'
    : signUp?.status === 'missing_requirements' &&
      signUp?.unverifiedFields.includes('email_address');

  if (isVerifying) {
    return (
      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <ThemedText type='subtitle' style={[styles.instructionText, { color: secondaryText }]}>
            Enter the code sent to your email
          </ThemedText>
          <TextInput
            ref={codeInputRef}
            style={[styles.input, { borderColor: secondaryText, color: textColor }]}
            value={code}
            placeholder='Verification code'
            placeholderTextColor={secondaryText}
            onChangeText={setCode}
            keyboardType='numeric'
            textContentType='oneTimeCode'
            returnKeyType='done'
            onSubmitEditing={handleVerify}
          />
          {error && (
            <ThemedText style={[styles.errorText, { color: errorColor }]}>
              {error}
            </ThemedText>
          )}
        </View>

        <View style={styles.bottomSection}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: primaryColor },
              (isLoading || !code) && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleVerify}
            disabled={isLoading || !code}
          >
            {isLoading ? (
              <ActivityIndicator color='#fff' />
            ) : (
              <ThemedText style={styles.buttonText}>Verify</ThemedText>
            )}
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            onPress={handleResend}
          >
            <ThemedText style={[styles.secondaryButtonText, { color: actionText }]}>
              Resend code
            </ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.formContainer}>
      <View style={styles.inputGroup}>
        <ThemedText style={[styles.label, { color: secondaryText }]}>Email address</ThemedText>
        <TextInput
          ref={emailInputRef}
          style={[styles.input, { borderColor: secondaryText, color: textColor }]}
          autoCapitalize='none'
          value={emailAddress}
          placeholder='Enter email'
          placeholderTextColor={secondaryText}
          onChangeText={setEmailAddress}
          keyboardType='email-address'
          autoComplete='email'
          autoCorrect={false}
          textContentType='emailAddress'
          returnKeyType='next'
          onSubmitEditing={() => passwordInputRef.current?.focus()}
          blurOnSubmit={false}
        />
        {error && (
          <ThemedText style={[styles.errorText, { color: errorColor }]}>
            {error}
          </ThemedText>
        )}
      </View>

      <View style={styles.inputGroup}>
        <ThemedText style={[styles.label, { color: secondaryText }]}>Password</ThemedText>
        <TextInput
          ref={passwordInputRef}
          style={[styles.input, { borderColor: secondaryText, color: textColor }]}
          value={password}
          placeholder='Enter password'
          placeholderTextColor={secondaryText}
          secureTextEntry={true}
          onChangeText={setPassword}
          textContentType='password'
          returnKeyType='done'
          onSubmitEditing={handleSubmit}
        />
      </View>

      <View style={styles.bottomSection}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: primaryColor },
            (isLoading || !emailAddress || !password || (isSignIn ? !signIn : !signUp)) &&
              styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleSubmit}
          disabled={isLoading || !emailAddress || !password || (isSignIn ? !signIn : !signUp)}
        >
          {isLoading ? (
            <ActivityIndicator color='#fff' />
          ) : (
            <ThemedText style={styles.buttonText}>{isSignIn ? 'Continue' : 'Sign up'}</ThemedText>
          )}
        </Pressable>

        <View style={styles.separatorContainer}>
          <View style={[styles.separator, { backgroundColor: alternateColor }]} />
          <ThemedText style={[styles.separatorText, { color: secondaryText }]}>OR</ThemedText>
          <View style={[styles.separator, { backgroundColor: alternateColor }]} />
        </View>

        <View style={styles.oauthContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.oauthButton,
              { borderColor: alternateColor },
              pressed && styles.buttonPressed,
            ]}
            onPress={() => handleOAuth('google')}
          >
            <Ionicons name='logo-google' size={20} color={textColor} />
            <ThemedText style={styles.oauthButtonText}>Google</ThemedText>
          </Pressable>

          {Platform.OS === 'ios' && (
            <Pressable
              style={({ pressed }) => [
                styles.oauthButton,
                { borderColor: alternateColor },
                pressed && styles.buttonPressed,
              ]}
              onPress={() => handleOAuth('apple')}
            >
              <Ionicons name='logo-apple' size={20} color={textColor} />
              <ThemedText style={styles.oauthButtonText}>Apple</ThemedText>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    gap: 36,
    marginBottom: 80,
    minHeight: 320,
  },
  inputGroup: {
    width: '100%',
  },
  bottomSection: {
    width: '100%',
  },
  label: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  instructionText: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    width: '100%',
  },
  button: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
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
  secondaryButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryButtonText: {
    fontWeight: '600',
    fontSize: 15,
  },
  errorText: {
    fontSize: 13,
    marginTop: 10,
    fontWeight: '500',
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  separator: {
    flex: 1,
    height: 1,
  },
  separatorText: {
    marginHorizontal: 16,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  oauthContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  oauthButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  oauthButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
