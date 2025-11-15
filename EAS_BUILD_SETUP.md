# EAS Build Setup Guide

## 🔐 Environment Variables for Production Builds

For EAS builds, you **must** set environment variables as secrets. The `.env` file is NOT included in production builds.

### Required Supabase Variables

Set these secrets in your EAS project:

```bash
# Set Supabase URL
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value https://your-project.supabase.co

# Set Supabase Anon Key
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value your-anon-key-here
```

### View Current Secrets

```bash
eas secret:list
```

### Update a Secret

```bash
eas secret:delete --name EXPO_PUBLIC_SUPABASE_URL
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value new-value
```

## 🚨 Common Issues

### Blank Screen After Splash

**Cause:** Missing Supabase environment variables

**Solution:**
1. Check if secrets are set: `eas secret:list`
2. If missing, create them using the commands above
3. Rebuild the app

### App Crashes on Launch

**Cause:** Supabase client initialization fails

**Solution:**
- Ensure both `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set
- Verify the values are correct (no extra spaces, full URLs)
- Check EAS build logs for error messages

## 📱 Build Commands

### Android

```bash
# AAB for Play Store
eas build --platform android --profile production

# APK for direct install
eas build --platform android --profile production-apk
```

### iOS

```bash
# App Store build
eas build --platform ios --profile production

# TestFlight/Preview build
eas build --platform ios --profile preview
```

### Both Platforms

```bash
eas build --platform all --profile production
```

## ✅ Verification Checklist

Before building, ensure:

- [ ] Supabase project is created and active
- [ ] Database migration SQL has been run
- [ ] Realtime is enabled for `feeds` table
- [ ] EAS secrets are set for Supabase URL and Key
- [ ] You can access Supabase dashboard with your credentials

## 🔍 Debugging

If the app shows a blank screen:

1. **Check build logs** in EAS dashboard for errors
2. **Verify secrets** are set correctly
3. **Test locally** first with `.env` file to ensure app works
4. **Check device logs** using `adb logcat` (Android) or Xcode console (iOS)

