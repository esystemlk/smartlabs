import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const BLUE = '#2563EB';
const MUTED = '#9AA6B8';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#EEF1F6',
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarActiveTintColor: BLUE,
        tabBarInactiveTintColor: MUTED,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size - 2} /> }}
      />
      <Tabs.Screen
        name="practice"
        options={{ title: 'Practice', tabBarIcon: ({ color, size }) => <Ionicons name="school" color={color} size={size - 2} /> }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: 'Progress', tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" color={color} size={size - 2} /> }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: 'Account', tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" color={color} size={size - 2} /> }}
      />
    </Tabs>
  );
}
