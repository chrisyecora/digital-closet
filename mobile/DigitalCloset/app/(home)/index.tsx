import { useAuth, useUser } from '@clerk/expo';
import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function Page() {
  const { user } = useUser();
  const { signOut } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="title">Welcome!</ThemedText>
        <ThemedText style={styles.email}>
          Hello, {user?.primaryEmailAddress?.emailAddress}
        </ThemedText>
        <Pressable 
          style={styles.button} 
          onPress={() => signOut()}
        >
          <ThemedText style={styles.buttonText}>Sign out</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    gap: 16,
  },
  email: {
    fontSize: 16,
    opacity: 0.8,
  },
  button: {
    backgroundColor: '#A99B75',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
