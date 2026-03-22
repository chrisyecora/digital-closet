import { ThemedText } from '@/components/themed-text';
import { useSignIn, useSignUp } from '@clerk/expo';
import { type Href, useRouter } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import { Pressable, StyleSheet, TextInput, View, ActivityIndicator } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

interface AuthFormProps {
  isSignIn: boolean;
}

export function AuthForm({ isSignIn }: AuthFormProps) {
  const router = useRouter();
  const { signIn, errors: signInErrors, fetchStatus: signInStatus } = useSignIn();
  const { signUp, errors: signUpErrors, fetchStatus: signUpStatus } = useSignUp();

  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const codeInputRef = useRef<TextInput>(null);

  // Auto-focus logic
  useEffect(() => {
    // Determine if we are in verification mode
    const isVerifying = isSignIn
      ? signIn?.status === 'needs_client_trust'
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
  }, [isSignIn, signIn?.status, signUp?.status]);

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');

  const primaryColor = useThemeColor({}, 'primary');
  const textColor = useThemeColor({}, 'text');
  const secondaryText = useThemeColor({}, 'secondaryText');
  const actionText = useThemeColor({}, 'actionText');
  const errorColor = useThemeColor({}, 'error');

  const isLoading = isSignIn ? signInStatus === 'fetching' : signUpStatus === 'fetching';
  const errors = isSignIn ? signInErrors : signUpErrors;

  // Sign In Logic
  const handleSignIn = async () => {
    if (!signIn) return;
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
          if (session?.currentTask) return;
          router.replace(decorateUrl('/') as Href);
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

  const handleSignInVerify = async () => {
    if (!signIn) return;
    await signIn.mfa.verifyEmailCode({ code });

    if (signIn.status === 'complete') {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) return;
          router.replace(decorateUrl('/') as Href);
        },
      });
    }
  };

  // Sign Up Logic
  const handleSignUp = async () => {
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

  const handleSignUpVerify = async () => {
    if (!signUp) return;
    await signUp.verifications.verifyEmailCode({ code });

    if (signUp.status === 'complete') {
      await signUp.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) return;
          router.replace(decorateUrl('/') as Href);
        },
      });
    }
  };

  const handleSubmit = isSignIn ? handleSignIn : handleSignUp;
  const handleVerify = isSignIn ? handleSignInVerify : handleSignUpVerify;
  const handleResend = isSignIn
    ? () => signIn?.mfa.sendEmailCode()
    : () => signUp?.verifications.sendEmailCode();

  // Determine if we are in verification mode
  const isVerifying = isSignIn
    ? signIn?.status === 'needs_client_trust'
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
          {errors?.fields?.code && (
            <ThemedText style={[styles.errorText, { color: errorColor }]}>
              {errors.fields.code.message}
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
        {isSignIn
          ? signInErrors?.fields?.identifier && (
              <ThemedText style={[styles.errorText, { color: errorColor }]}>
                {signInErrors.fields.identifier.message}
              </ThemedText>
            )
          : signUpErrors?.fields?.emailAddress && (
              <ThemedText style={[styles.errorText, { color: errorColor }]}>
                {signUpErrors.fields.emailAddress.message}
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
        {(errors as any)?.fields?.password && (
          <ThemedText style={[styles.errorText, { color: errorColor }]}>
            {(errors as any).fields.password.message}
          </ThemedText>
        )}
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    flex: 1,
    // justifyContent: 'space-between',
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
});
