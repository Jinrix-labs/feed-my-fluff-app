// Debug: Check environment variables at config load time
console.log('🔍 [app.config.js] Environment check:');
console.log('  EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? '✓ Set (' + process.env.EXPO_PUBLIC_SUPABASE_URL.substring(0, 30) + '...)' : '✗ Missing');
console.log('  EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set (' + process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + '...)' : '✗ Missing');

export default {
  expo: {
    name: "FeedMyFluff",
    slug: "feedmyfluff",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/feed-my-fluff.png",
    userInterfaceStyle: "automatic",
    scheme: "feedmyfluff",
    newArchEnabled: true,
    ios: {
      bundleIdentifier: "io.jinrix.feedmyfluff",
      supportsTablet: true,
      buildNumber: "1",
      deploymentTarget: "15.1",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSPhotoLibraryUsageDescription: "This app needs access to your photo library to select pet photos.",
        NSCameraUsageDescription: "This app needs access to your camera to take photos of your pets.",
        NSPhotoLibraryAddUsageDescription: "This app needs permission to save photos to your library.",
        NSLocationWhenInUseUsageDescription: "This app uses location to help you find nearby pet services.",
        NSContactsUsageDescription: "This app needs access to contacts to help you share with family members.",
        NSCalendarsUsageDescription: "This app needs access to your calendar to manage feeding reminders.",
        NSRemindersUsageDescription: "This app needs access to reminders to set feeding schedules.",
        NSMicrophoneUsageDescription: "This app needs microphone access for audio features.",
        NSUserNotificationsUsageDescription: "This app needs notification permissions to remind you about feeding times."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/feed-my-fluff.png",
        backgroundColor: "#ffffff"
      },
      permissions: [
        "android.permission.RECORD_AUDIO",
        "android.permission.MODIFY_AUDIO_SETTINGS"
      ],
      package: "io.jinrix.feedmyfluff"
    },
    plugins: [
      [
        "expo-router",
        {
          sitemap: false
        }
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-paw.png",
          imageWidth: 200,
          resizeMode: "contain"
        }
      ],
      "expo-audio",
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static"
          }
        }
      ],
      "expo-video",
      "expo-secure-store",
      "expo-web-browser",
      [
        "expo-notifications",
        {
          icon: "./assets/images/notification-icon.png",
          color: "#744BFF",
          sounds: [],
          mode: "production"
        }
      ]
    ],
    web: {
      bundler: "metro",
      favicon: "./assets/images/feed-my-fluff.png"
    },
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {
        origin: false,
        sitemap: false
      },
      eas: {
        projectId: "0d97754c-6fd4-42a4-ac4e-9987dcbfb8a3"
      },
      // Supabase environment variables - automatically available from process.env in EAS builds
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    },
    runtimeVersion: "1.0.0"
  }
};

