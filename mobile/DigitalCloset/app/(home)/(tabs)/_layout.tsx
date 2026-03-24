import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function TabsLayout() {
  const primaryColor = useThemeColor({}, 'primary');
  const backgroundColor = useThemeColor({}, 'background');
  const tabIconDefault = useThemeColor({}, 'tabIconDefault');

  const hapticTab = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        tabBarIconStyle: styles.tabBarIcon,
        tabBarBackground: () => (
          <BlurView
            tint={Platform.OS === 'ios' ? 'systemChromeMaterial' : 'default'}
            intensity={60}
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarActiveTintColor: primaryColor,
        tabBarInactiveTintColor: tabIconDefault,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={24}
              color={color}
            />
          ),
          tabBarButton: ({ ref, ...props }) => (
            <Pressable
              {...props}
              style={[props.style as any, styles.tabButton]}
              onPress={(e) => {
                hapticTab();
                props.onPress?.(e);
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Camera',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.cameraButton, { backgroundColor: primaryColor }]}>
              <Ionicons
                name={focused ? 'camera' : 'camera-outline'}
                size={28}
                color="#FFFFFF"
              />
            </View>
          ),
          tabBarButton: ({ ref, ...props }) => (
            <Pressable
              {...props}
              style={[props.style as any, styles.tabButton]}
              onPress={(e) => {
                hapticTab();
                props.onPress?.(e);
              }}
            />
          ),
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="closet"
        options={{
          title: 'Closet',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'shirt' : 'shirt-outline'}
              size={24}
              color={color}
            />
          ),
          tabBarButton: ({ ref, ...props }) => (
            <Pressable
              {...props}
              style={[props.style as any, styles.tabButton]}
              onPress={(e) => {
                hapticTab();
                props.onPress?.(e);
              }}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 24,
    marginHorizontal: 20,
    borderRadius: 32,
    overflow: 'hidden',
    height: 64,
    borderTopWidth: 0,
    backgroundColor: 'transparent',
    elevation: 8,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
  },
  tabBarItem: {
    height: 64,
    margin: 0,
    padding: 0,
  },
  tabBarIcon: {
    margin: 0,
    padding: 0,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
});
