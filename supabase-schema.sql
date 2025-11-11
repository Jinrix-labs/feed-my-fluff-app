-- Supabase Database Schema for FeedMyFluff App
-- Run this SQL in your Supabase SQL Editor

-- 1. Create family_members table
CREATE TABLE IF NOT EXISTS family_members (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create pets table
CREATE TABLE IF NOT EXISTS pets (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  breed TEXT,
  age INTEGER,
  emoji TEXT NOT NULL DEFAULT '🐕',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create feeds table
CREATE TABLE IF NOT EXISTS feeds (
  id BIGSERIAL PRIMARY KEY,
  family_member_id BIGINT REFERENCES family_members(id) ON DELETE CASCADE,
  pet_id BIGINT REFERENCES pets(id) ON DELETE CASCADE,
  food_type TEXT NOT NULL,
  fed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  food_type TEXT NOT NULL,
  reminder_time TIME NOT NULL,
  days_of_week INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5,6,7}',
  is_active BOOLEAN DEFAULT true,
  created_by BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_feeds_family_member_id ON feeds(family_member_id);
CREATE INDEX IF NOT EXISTS idx_feeds_pet_id ON feeds(pet_id);
CREATE INDEX IF NOT EXISTS idx_feeds_fed_at ON feeds(fed_at DESC);
CREATE INDEX IF NOT EXISTS idx_reminders_reminder_time ON reminders(reminder_time);
CREATE INDEX IF NOT EXISTS idx_reminders_is_active ON reminders(is_active);

-- 6. Enable Row Level Security (RLS) - Optional but recommended
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- 7. Create policies to allow all operations (for now - you can restrict later)
-- For family_members
CREATE POLICY "Allow all operations on family_members"
  ON family_members
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- For pets
CREATE POLICY "Allow all operations on pets"
  ON pets
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- For feeds
CREATE POLICY "Allow all operations on feeds"
  ON feeds
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- For reminders
CREATE POLICY "Allow all operations on reminders"
  ON reminders
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 8. Optional: Insert some sample data
INSERT INTO family_members (name, emoji) VALUES
  ('Mom', '👩'),
  ('Dad', '👨'),
  ('Sister', '👧'),
  ('Brother', '👦')
ON CONFLICT DO NOTHING;

INSERT INTO pets (name, breed, age, emoji) VALUES
  ('Fluff', 'Golden Retriever', 3, '🐕')
ON CONFLICT DO NOTHING;

