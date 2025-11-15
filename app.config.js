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
      bundleIdentifier: "com.jinrixlabs.feedmyfluff",
      supportsTablet: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
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
      package: "com.feedmyfluff.app"
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
      "expo-web-browser"
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

