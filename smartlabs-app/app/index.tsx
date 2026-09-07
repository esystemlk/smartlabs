import { Redirect } from 'expo-router';

// The AuthGate in _layout redirects based on auth state; this just points the
// initial route at the tabs (or login if signed out).
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
