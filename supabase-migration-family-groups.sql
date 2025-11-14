-- Migration: Add family groups and authentication support
-- Run this SQL in your Supabase SQL Editor

-- 1. Create family_groups table
CREATE TABLE IF NOT EXISTS family_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create user_family_groups junction table (many-to-many)
CREATE TABLE IF NOT EXISTS user_family_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, group_id)
);

-- 3. Update feeds table to include group_id and fed_by
ALTER TABLE feeds 
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS fed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 4. Update pets table to include group_id
ALTER TABLE pets 
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE;

-- 5. Update reminders table to include group_id
ALTER TABLE reminders 
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE;

-- 6. Update family_members table to include group_id (optional - can keep local or migrate)
ALTER TABLE family_members 
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 7. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_feeds_group_id ON feeds(group_id);
CREATE INDEX IF NOT EXISTS idx_feeds_fed_by ON feeds(fed_by);
CREATE INDEX IF NOT EXISTS idx_pets_group_id ON pets(group_id);
CREATE INDEX IF NOT EXISTS idx_reminders_group_id ON reminders(group_id);
CREATE INDEX IF NOT EXISTS idx_family_members_group_id ON family_members(group_id);
CREATE INDEX IF NOT EXISTS idx_user_family_groups_user_id ON user_family_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_user_family_groups_group_id ON user_family_groups(group_id);
CREATE INDEX IF NOT EXISTS idx_family_groups_invite_code ON family_groups(invite_code);

-- 8. Enable Row Level Security (RLS)
ALTER TABLE family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_family_groups ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies for family_groups
-- Users can read groups they belong to
CREATE POLICY "Users can view their family groups"
  ON family_groups
  FOR SELECT
  USING (
    id IN (
      SELECT group_id FROM user_family_groups 
      WHERE user_id = auth.uid()
    )
  );

-- Users can create groups
CREATE POLICY "Users can create family groups"
  ON family_groups
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Users can update groups they created
CREATE POLICY "Users can update their created groups"
  ON family_groups
  FOR UPDATE
  USING (auth.uid() = created_by);

-- 10. Create RLS policies for user_family_groups
CREATE POLICY "Users can view their group memberships"
  ON user_family_groups
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can join groups via invite code"
  ON user_family_groups
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 11. Create RLS policies for feeds (group-based access)
CREATE POLICY "Users can view feeds in their groups"
  ON feeds
  FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM user_family_groups 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert feeds in their groups"
  ON feeds
  FOR INSERT
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM user_family_groups 
      WHERE user_id = auth.uid()
    )
    AND fed_by = auth.uid()
  );

CREATE POLICY "Users can update their own feeds"
  ON feeds
  FOR UPDATE
  USING (fed_by = auth.uid());

CREATE POLICY "Users can delete their own feeds"
  ON feeds
  FOR DELETE
  USING (fed_by = auth.uid());

-- 12. Create RLS policies for pets (group-based access)
CREATE POLICY "Users can view pets in their groups"
  ON pets
  FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM user_family_groups 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage pets in their groups"
  ON pets
  FOR ALL
  USING (
    group_id IN (
      SELECT group_id FROM user_family_groups 
      WHERE user_id = auth.uid()
    )
  );

-- 13. Create RLS policies for reminders (group-based access)
CREATE POLICY "Users can view reminders in their groups"
  ON reminders
  FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM user_family_groups 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage reminders in their groups"
  ON reminders
  FOR ALL
  USING (
    group_id IN (
      SELECT group_id FROM user_family_groups 
      WHERE user_id = auth.uid()
    )
  );

-- 14. Enable Realtime for feeds table
ALTER PUBLICATION supabase_realtime ADD TABLE feeds;

-- 15. Create function to generate invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate a 6-character alphanumeric code
    code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM family_groups WHERE invite_code = code) INTO exists_check;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- 16. Create trigger to auto-generate invite codes
CREATE OR REPLACE FUNCTION set_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    NEW.invite_code := generate_invite_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_family_group_invite_code
  BEFORE INSERT ON family_groups
  FOR EACH ROW
  EXECUTE FUNCTION set_invite_code();

