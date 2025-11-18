# Fix Foreign Keys for Supabase Relationships

## The Problem

You're getting this error:
```
"could not find a relationship between 'feeds' and 'family_members' in the schema cache"
```

This happens because Supabase PostgREST needs **foreign key constraints** to detect relationships between tables. Without them, nested selects like `family_members(name, emoji)` won't work.

## The Solution

### Step 1: Run the SQL Migration

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy and paste the contents of `add-feeds-foreign-keys.sql`
4. Click **Run** (or press `Ctrl+Enter`)

This will:
- Add `feeds_family_member_id_fkey` foreign key constraint
- Add `feeds_pet_id_fkey` foreign key constraint
- Verify the constraints were created
- Test the relationships with a sample query

### Step 2: Refresh Schema Cache ⚠️ IMPORTANT

Supabase caches the schema, so you **must** refresh it:

1. Go to **Project Settings** → **Database**
2. Scroll down to find **"Reset Schema Cache"** button
3. Click **"Reset Cache"**
4. Wait 3-10 seconds for it to complete

**Without this step, the relationships won't be detected even after adding foreign keys!**

### Step 3: Test It

After refreshing the cache, your `getFeeds()` function will now work with:

```javascript
.select(`
  id,
  food_type,
  fed_at,
  notes,
  family_members(name, emoji),
  pets(name, emoji)
`)
```

The function has been updated in `src/lib/feeds.js` to use this syntax.

## What Changed

- ✅ Created `add-feeds-foreign-keys.sql` - SQL migration to add foreign keys
- ✅ Updated `getFeeds()` function - Now uses proper Supabase relationship syntax
- ✅ Removed all the workaround fallback code

## Verification

After running the SQL, you should see output showing:
- `feeds_family_member_id_fkey` constraint
- `feeds_pet_id_fkey` constraint
- A test query returning sample data

If you see errors, make sure:
- The `feeds` table exists
- The `family_members` table exists  
- The `pets` table exists
- The columns `family_member_id` and `pet_id` exist in the `feeds` table

## Troubleshooting

**Still getting relationship errors?**
- Make sure you clicked "Reset Schema Cache" in Supabase dashboard
- Wait a few seconds after resetting
- Try refreshing your app

**Foreign key constraint errors?**
- Check that all referenced tables exist
- Verify the column types match (BIGINT)
- Make sure there are no orphaned records (feeds with invalid family_member_id or pet_id)

