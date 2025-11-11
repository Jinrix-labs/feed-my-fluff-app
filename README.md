### Environment variables

Create a `.env` file (same folder as `package.json`) and set:

```
EXPO_PUBLIC_PROJECT_GROUP_ID=dev
EXPO_PUBLIC_BASE_URL=http://localhost:3000
EXPO_PUBLIC_PROXY_BASE_URL=http://localhost:3000
EXPO_PUBLIC_HOST=localhost:3000

# Optional
EXPO_PUBLIC_UPLOADCARE_PUBLIC_KEY=demo
EXPO_PUBLIC_BASE_CREATE_USER_CONTENT_URL=http://localhost:3000
EXPO_PUBLIC_LOGS_ENDPOINT=http://localhost:3000/logs
EXPO_PUBLIC_CREATE_TEMP_API_KEY=local
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

Android networking notes:
- Android emulator maps `localhost` to `10.0.2.2` (or `10.0.3.2` for Genymotion).
- On emulator, prefer:
  - `EXPO_PUBLIC_BASE_URL=http://10.0.2.2:3000`
  - `EXPO_PUBLIC_PROXY_BASE_URL=http://10.0.2.2:3000`
  - `EXPO_PUBLIC_HOST=10.0.2.2:3000`
- On a physical device, use your computer's LAN IP, e.g. `http://192.168.1.10:3000`.

### Development build (required for `expo-notifications` on Android, SDK 53+)

Expo Go no longer supports Android push notifications with SDK 53. Use a development build:

```
# Option A: local dev build
npx expo run:android
# or iOS (macOS)
npx expo run:ios

# Option B: EAS Dev Client
npx expo install expo-dev-client
eas build --profile development --platform android
eas build --profile development --platform ios
```

After installing the dev build, start the server and open the app:
```
npx expo start
```

### Clean install & cache reset
```
rimraf node_modules .expo .cache caches
npm install
npx expo start --clear
```


