import { useSupabaseAuth } from '@/utils/auth/useSupabaseAuth';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AnimatedSplashScreen from '@/components/AnimatedSplashScreen';
import { View, ActivityIndicator } from 'react-native';
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
  const [splashComplete, setSplashComplete] = useState(false);

  useEffect(() => {
    if (!loading && splashComplete) {
      SplashScreen.hideAsync().catch(err => {
        console.error("Error hiding splash screen:", err);
      });
    }
  }, [loading, splashComplete]);

  // Show animated splash screen first
  if (showSplash) {
    return (
      <AnimatedSplashScreen 
        onAnimationComplete={() => {
          setShowSplash(false);
          setSplashComplete(true);
        }} 
      />
    );
  }

  // Show loading indicator while auth initializes
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
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
