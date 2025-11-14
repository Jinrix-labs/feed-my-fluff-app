import { useSupabaseAuth } from '@/utils/auth/useSupabaseAuth';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AnimatedSplashScreen from '@/components/AnimatedSplashScreen';
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const { loading } = useSupabaseAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  // Show animated splash screen first
  if (showSplash) {
    return <AnimatedSplashScreen onAnimationComplete={() => setShowSplash(false)} />;
  }

  if (loading) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack
          screenOptions={{ headerShown: false, animation: "none" }}
          initialRouteName="index"
        >
          <Stack.Screen name="index" options={{ animation: "none" }} />
          <Stack.Screen name="auth" options={{ animation: "fade" }} />
          <Stack.Screen name="family-setup" options={{ animation: "fade" }} />
          <Stack.Screen name="(tabs)" options={{ animation: "none" }} />
          <Stack.Screen name="settings" options={{ animation: "fade" }} />
        </Stack>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
