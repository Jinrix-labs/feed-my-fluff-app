-- Add foreign key constraints to feeds table
-- This enables Supabase PostgREST to detect relationships for nested selects
-- Run this in Supabase SQL Editor

-- STEP 1: Add foreign key for family_members
-- Check if constraint already exists before adding
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_feeds_family_member' 
    AND table_name = 'feeds'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE feeds
    ADD CONSTRAINT fk_feeds_family_member
    FOREIGN KEY (family_member_id)
    REFERENCES family_members(id)
    ON DELETE SET NULL;
    
    RAISE NOTICE 'Added foreign key: fk_feeds_family_member';
  ELSE
    RAISE NOTICE 'Foreign key fk_feeds_family_member already exists';
  END IF;
END $$;

-- STEP 2: Add foreign key for pets
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'feeds_pet_id_fkey' 
    AND table_name = 'feeds'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE feeds
    ADD CONSTRAINT feeds_pet_id_fkey
    FOREIGN KEY (pet_id) REFERENCES pets(id)
    ON DELETE CASCADE;
    
    RAISE NOTICE 'Added foreign key: feeds_pet_id_fkey';
  ELSE
    RAISE NOTICE 'Foreign key feeds_pet_id_fkey already exists';
  END IF;
END $$;

-- STEP 2.5: Add foreign key for family_groups (group_id)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_feeds_group' 
    AND table_name = 'feeds'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE feeds
    ADD CONSTRAINT fk_feeds_group
    FOREIGN KEY (group_id)
    REFERENCES family_groups(id)
    ON DELETE CASCADE;
    
    RAISE NOTICE 'Added foreign key: fk_feeds_group';
  ELSE
    RAISE NOTICE 'Foreign key fk_feeds_group already exists';
  END IF;
END $$;

-- STEP 3: Verify the foreign keys were created
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'feeds'
  AND tc.table_schema = 'public'
ORDER BY tc.constraint_name;

-- STEP 4: Test query to verify relationships work
-- This should return rows if everything is set up correctly
SELECT
  feeds.id,
  feeds.food_type,
  feeds.fed_at,
  feeds.notes,
  family_members.name AS family_member_name,
  family_members.emoji AS family_member_emoji,
  pets.name AS pet_name,
  pets.emoji AS pet_emoji
FROM feeds
LEFT JOIN family_members ON feeds.family_member_id = family_members.id
LEFT JOIN pets ON feeds.pet_id = pets.id
LIMIT 5;

-- After running this:
-- 1. Go to Project Settings → Database → "Reset Schema Cache"
-- 2. Click "Reset Cache" (takes 3-10 seconds)
-- 3. Your getFeeds() function will now work with nested selects!

