-- Migration: Add pets table and pet_id to feeds
-- Run this AFTER running the main schema if your feeds table already exists

-- 1. Create pets table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS pets (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  breed TEXT,
  age INTEGER,
  emoji TEXT NOT NULL DEFAULT '🐕',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add pet_id column to feeds table (if it doesn't exist)
-- Make it nullable initially so existing feeds don't break
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'feeds' AND column_name = 'pet_id'
  ) THEN
    -- First add the column as nullable
    ALTER TABLE feeds ADD COLUMN pet_id BIGINT;
    
    -- Set default pet_id for existing feeds (use first pet or NULL)
    UPDATE feeds 
    SET pet_id = (SELECT id FROM pets LIMIT 1)
    WHERE pet_id IS NULL AND EXISTS (SELECT 1 FROM pets);
    
    -- Now add the foreign key constraint
    ALTER TABLE feeds 
    ADD CONSTRAINT feeds_pet_id_fkey 
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. Create index for pet_id (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_feeds_pet_id ON feeds(pet_id);

-- 4. Enable RLS on pets table
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

-- 5. Create policy for pets (if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'pets' AND policyname = 'Allow all operations on pets'
  ) THEN
    CREATE POLICY "Allow all operations on pets"
      ON pets
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 6. Insert sample pet data (if no pets exist)
INSERT INTO pets (name, breed, age, emoji) 
SELECT 'Fluff', 'Golden Retriever', 3, '🐕'
WHERE NOT EXISTS (SELECT 1 FROM pets WHERE name = 'Fluff');

