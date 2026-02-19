# delete-account Edge Function

Required for **Apple App Store** when the app offers sign-up (account deletion must be available).

## What it does

- Verifies the request using the user's JWT (sent by the Supabase client).
- Deletes the user from `auth.users` using the service role (server-side only).

## Deploy

### Option A: Supabase CLI (recommended)

1. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) if needed.
2. Log in and link your project (one-time):
   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   Get `YOUR_PROJECT_REF` from the project URL in the Dashboard (e.g. `https://app.supabase.com/project/mqmbequgylfucqdlxcif` → ref is `mqmbequgylfucqdlxcif`).
3. From the project root, deploy the function:
   ```bash
   cd d:\feed-my-fluff
   supabase functions deploy delete-account
   ```

Supabase sets `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` for deployed functions automatically.

### Option B: Supabase Dashboard

1. In the [Supabase Dashboard](https://app.supabase.com) → your project → **Edge Functions**.
2. Click **Create a new function**, name it `delete-account`.
3. Replace the default code with the contents of `supabase/functions/delete-account/index.ts`.
4. Deploy. The function will have access to the same env vars (URL and keys).

## Invoke from the app

The app calls this from **Settings → Delete Account**. No extra env vars are needed; the client sends the session automatically.
