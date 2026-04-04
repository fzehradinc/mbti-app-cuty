import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import OnboardingScreen from './onboarding';

const ONBOARDING_KEY = 'hasCompletedOnboarding';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { session, loading: authLoading } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      setOnboardingDone(val === 'true');
      SplashScreen.hideAsync();
    });
  }, []);

  // Still loading auth or onboarding check
  if (authLoading || onboardingDone === null) return null;

  // Not authenticated → show the onboarding/auth screen
  if (!session) {
    return (
      <OnboardingScreen
        onContinue={async () => {
          await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
          setOnboardingDone(true);
        }}
      />
    );
  }

  // Mark onboarding as done once authenticated
  if (!onboardingDone) {
    AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#09090C' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="meclis-kur"
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="tartisma/[id]" />
      <Stack.Screen name="yanita-derinles" />
      <Stack.Screen
        name="meclis-karar"
        options={{ animation: 'fade' }}
      />
      <Stack.Screen name="rapor-detay/[id]" />
      <Stack.Screen name="privacy-policy" />
      <Stack.Screen name="terms-of-service" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#09090C" />
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
