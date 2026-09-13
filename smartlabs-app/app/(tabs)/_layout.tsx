import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { C } from '@/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: C.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '700' },
        tabBarActiveTintColor: C.blue,
        tabBarInactiveTintColor: '#9AA6B8',
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
