import { ThemedText } from '@/components/themed-text';
import { useSignIn } from '@clerk/expo';
import { type Href, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

export function SignInForm() {
  const { signIn, errors, fetchStatus } = useSignIn();
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
    const { error } = await signIn.password({
      emailAddress,
      password,
    });
    if (error) {
      console.error(JSON.stringify(error, null, 2));
      return;
    }

    if (signIn.status === 'complete') {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            console.log(session?.currentTask);
            return;
          }

          const url = decorateUrl('/');
          router.replace(url as Href);
        },
      });
    } else if (signIn.status === 'needs_client_trust') {
      const emailCodeFactor = signIn.supportedSecondFactors.find(
        (factor) => factor.strategy === 'email_code',
      );

      if (emailCodeFactor) {
        await signIn.mfa.sendEmailCode();
      }
    }
  };

  const handleVerify = async () => {
    await signIn.mfa.verifyEmailCode({ code });

    if (signIn.status === 'complete') {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            console.log(session?.currentTask);
            return;
          }

          const url = decorateUrl('/');
          router.replace(url as Href);
        },
      });
    }
  };

  if (signIn.status === 'needs_client_trust') {
    return (
      <View style={styles.formContainer}>
        <ThemedText type='title' style={[styles.title, { color: secondaryText }]}>
          Verify your account
        </ThemedText>
        <TextInput
          style={[styles.input, { borderColor: secondaryText, backgroundColor, color: textColor }]}
          value={code}
          placeholder='Enter your verification code'
          placeholderTextColor={secondaryText}
          onChangeText={(code) => setCode(code)}
          keyboardType='numeric'
        />
        {errors.fields.code && (
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
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          onPress={() => signIn.mfa.sendEmailCode()}
        >
          <ThemedText style={[styles.secondaryButtonText, { color: actionText }]}>I need a new code</ThemedText>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          onPress={() => signIn.reset()}
        >
          <ThemedText style={[styles.secondaryButtonText, { color: actionText }]}>Start over</ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.formContainer}>
      <ThemedText style={[styles.label, { color: secondaryText }]}>Email address</ThemedText>
      <TextInput
        style={[styles.input, { borderColor: secondaryText, backgroundColor, color: textColor }]}
        autoCapitalize='none'
        value={emailAddress}
        placeholder='Enter email'
        placeholderTextColor={secondaryText}
        onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
        keyboardType='email-address'
      />
      {errors.fields.identifier && (
        <ThemedText style={[styles.error, { color: errorColor }]}>{errors.fields.identifier.message}</ThemedText>
      )}
      <ThemedText style={[styles.label, { color: secondaryText }]}>Password</ThemedText>
      <TextInput
        style={[styles.input, { borderColor: secondaryText, backgroundColor, color: textColor }]}
        value={password}
        placeholder='Enter password'
        placeholderTextColor={secondaryText}
        secureTextEntry={true}
        onChangeText={(password) => setPassword(password)}
      />
      {errors.fields.password && (
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
        <ThemedText style={styles.buttonText}>Continue</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
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
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryButtonText: {
    fontWeight: '600',
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
