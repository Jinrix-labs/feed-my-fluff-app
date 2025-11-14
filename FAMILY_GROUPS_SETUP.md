# Family Groups Setup Guide

This guide explains how to set up and use the family group sharing system with Supabase.

## 🗄️ Database Setup

1. **Run the migration SQL** in your Supabase SQL Editor:
   - Open `supabase-migration-family-groups.sql`
   - Copy and paste the entire file into Supabase SQL Editor
   - Click "Run" to execute

2. **Enable Realtime** (if not already enabled):
   - Go to Database → Replication in Supabase dashboard
   - Make sure the `feeds` table is enabled for replication

## 🔐 Authentication Setup

The system uses Supabase Auth. Make sure you have:

1. **Supabase Auth enabled** in your project
2. **Email/Password authentication** configured (or other providers)
3. **Environment variables** set:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

## 📱 Usage Example

### 1. Sign in with Supabase Auth

```javascript
import { supabase } from '@/lib/supabase';

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
});

// Sign out
await supabase.auth.signOut();
```

### 2. Create or Join a Family Group

```javascript
import { createFamilyGroup, joinFamilyGroupByInviteCode, getActiveFamilyGroup } from '@/lib/familyGroups';

// Create a new family group
const group = await createFamilyGroup("The Smith Family");

// Join an existing group by invite code
const group = await joinFamilyGroupByInviteCode("ABC123");

// Get the active group (first group user belongs to)
const activeGroup = await getActiveFamilyGroup();
```

### 3. Use Feeds with Group Filtering

```javascript
import { getFeeds, addFeed } from '@/lib/feeds';
import { getActiveFamilyGroup } from '@/lib/familyGroups';

// Get the active group
const group = await getActiveFamilyGroup();
if (!group) {
  // User needs to create or join a group first
  return;
}

// Get feeds for the group
const feeds = await getFeeds(group.id);

// Add a feed (group_id and fed_by are automatically set)
const newFeed = await addFeed({
  group_id: group.id,
  pet_id: petId,
  food_type: "Dry Food",
  notes: "Morning meal"
});
```

### 4. Add Realtime Updates

```javascript
import { useEffect, useState } from 'react';
import { useRealtimeFeeds } from '@/utils/useRealtimeFeeds';
import { getFeeds } from '@/lib/feeds';
import { getActiveFamilyGroup } from '@/lib/familyGroups';

function TodayScreen() {
  const [feeds, setFeeds] = useState([]);
  const [groupId, setGroupId] = useState(null);

  // Get the active group on mount
  useEffect(() => {
    getActiveFamilyGroup().then(group => {
      if (group) {
        setGroupId(group.id);
        // Initial fetch
        getFeeds(group.id).then(setFeeds);
      }
    });
  }, []);

  // Subscribe to realtime updates
  useRealtimeFeeds(groupId, (payload) => {
    console.log('Feed changed:', payload);
    
    // Refresh feeds when any change occurs
    if (groupId) {
      getFeeds(groupId).then(setFeeds);
    }
  });

  // ... rest of component
}
```

### 5. Update Existing Components

**Before:**
```javascript
const feeds = await getFeeds(); // ❌ No group filtering
```

**After:**
```javascript
const group = await getActiveFamilyGroup();
if (!group) {
  // Handle no group case
  return;
}
const feeds = await getFeeds(group.id); // ✅ Filtered by group
```

## 🔄 How It Works

1. **User signs in** → Gets a `user.id` from Supabase Auth
2. **User creates/joins a group** → Gets a `group_id`
3. **All data is filtered by `group_id`**:
   - Feeds: `group_id` + `fed_by` (user who logged the feed)
   - Pets: `group_id`
   - Reminders: `group_id`
4. **Realtime updates** → All devices in the same group see changes instantly

## 🛡️ Security (RLS Policies)

Row Level Security (RLS) is enabled:
- Users can only see data from groups they belong to
- Users can only create feeds in their groups
- Users can only delete their own feeds

## 📝 Next Steps

1. Update your existing components to:
   - Get the active family group
   - Pass `group_id` to all data fetching functions
   - Add realtime subscriptions where needed

2. Add UI for:
   - Creating/joining family groups
   - Displaying invite codes
   - Managing group members

3. Optional enhancements:
   - Group selection (if user belongs to multiple groups)
   - Group settings/management
   - Member invitations via email

