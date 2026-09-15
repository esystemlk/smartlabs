import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { C } from '@/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: C.border,
          height: 64 + Math.max(insets.bottom, 8) + Math.max(0, fontScale - 1) * 18,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 10,
        },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '700' },
        tabBarActiveTintColor: C.blue,
        tabBarInactiveTintColor: C.slate,
        tabBarActiveBackgroundColor: C.tintBlueSoft,
        tabBarItemStyle: { borderRadius: 18, marginHorizontal: 4 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size - 3} /> }}
      />
      <Tabs.Screen
        name="practice"
        options={{ title: 'Practice', tabBarIcon: ({ color, size }) => <Ionicons name="mic" color={color} size={size - 3} /> }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: 'Progress', tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" color={color} size={size - 3} /> }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size - 3} /> }}
      />
    </Tabs>
  );
}
