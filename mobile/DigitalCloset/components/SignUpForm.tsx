import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth, useSignUp } from '@clerk/expo';
import { type Href, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

export function SignUpForm() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [code, setCode] = React.useState('');

  const primaryColor = useThemeColor({}, 'primary');
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const secondaryText = useThemeColor({}, 'secondaryText');
  const actionText = useThemeColor({}, 'actionText');
  const errorColor = useThemeColor({}, 'error');

  const handleSubmit = async () => {
    if (!signUp) return;
    const { error } = await signUp.password({
      emailAddress,
      password,
    });
    if (error) {
      console.error(JSON.stringify(error, null, 2));
      return;
    }

    if (!error) await signUp.verifications.sendEmailCode();
  };

  const handleVerify = async () => {
    if (!signUp) return;
    await signUp.verifications.verifyEmailCode({
      code,
    });
    if (signUp.status === 'complete') {
      await signUp.finalize({
        // Redirect the user to the home page after signing up
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            // Handle pending session tasks
            // See https://clerk.com/docs/guides/development/custom-flows/authentication/session-tasks
            console.log(session?.currentTask);
            return;
          }

          const url = decorateUrl('/');
          router.replace(url as Href);
        },
      });
    } else {
      // Check why the sign-up is not complete
      console.error('Sign-up attempt not complete:', signUp);
    }
  };

  if (!signUp || signUp.status === 'complete' || isSignedIn) {
    return null;
  }

  if (
    signUp.status === 'missing_requirements' &&
    signUp.unverifiedFields.includes('email_address') &&
    signUp.missingFields.length === 0
  ) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type='title' style={styles.title}>
          Verify your account
        </ThemedText>
        <TextInput
          style={[styles.input, { borderColor: secondaryText, color: textColor, backgroundColor }]}
          value={code}
          placeholder='Enter your verification code'
          placeholderTextColor={secondaryText}
          onChangeText={(code) => setCode(code)}
          keyboardType='numeric'
        />
        {errors?.fields?.code && (
          <ThemedText style={[styles.error, { color: errorColor }]}>{errors.fields.code.message}</ThemedText>
        )}
        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: primaryColor },
            fetchStatus === 'fetching' && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleVerify}
          disabled={fetchStatus === 'fetching'}
        >
          <ThemedText style={styles.buttonText}>Verify</ThemedText>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => signUp.verifications.sendEmailCode()}
        >
          <ThemedText style={[styles.secondaryButtonText, { color: actionText }]}>
            I need a new code
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type='title' style={styles.title}>
        Sign up
      </ThemedText>

      <ThemedText style={[styles.label, { color: secondaryText }]}>Email address</ThemedText>
      <TextInput
        style={[styles.input, { borderColor: secondaryText, color: textColor, backgroundColor }]}
        autoCapitalize='none'
        value={emailAddress}
        placeholder='Enter email'
        placeholderTextColor={secondaryText}
        onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
        keyboardType='email-address'
      />
      {errors?.fields?.emailAddress && (
        <ThemedText style={[styles.error, { color: errorColor }]}>{errors.fields.emailAddress.message}</ThemedText>
      )}
      <ThemedText style={[styles.label, { color: secondaryText }]}>Password</ThemedText>
      <TextInput
        style={[styles.input, { borderColor: secondaryText, color: textColor, backgroundColor }]}
        value={password}
        placeholder='Enter password'
        placeholderTextColor={secondaryText}
        secureTextEntry={true}
        onChangeText={(password) => setPassword(password)}
      />
      {errors?.fields?.password && (
        <ThemedText style={[styles.error, { color: errorColor }]}>{errors.fields.password.message}</ThemedText>
      )}
      <Pressable
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: primaryColor },
          (!emailAddress || !password || fetchStatus === 'fetching') && styles.buttonDisabled,
          pressed && styles.buttonPressed,
        ]}
        onPress={handleSubmit}
        disabled={!emailAddress || !password || fetchStatus === 'fetching'}
      >
        <ThemedText style={styles.buttonText}>Sign up</ThemedText>
      </Pressable>

      {/* Required for sign-up flows. Clerk's bot sign-up protection is enabled by default */}
      <View nativeID='clerk-captcha' />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  title: {
    marginBottom: 8,
  },
  label: {
    fontWeight: '600',
    fontSize: 14,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
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
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  secondaryButtonText: {
    fontWeight: '600',
    fontSize: 15,
  },
  error: {
    color: '#d32f2f',
    fontSize: 12,
    marginTop: -8,
  },
  debug: {
    fontSize: 10,
    opacity: 0.5,
    marginTop: 8,
  },
});
