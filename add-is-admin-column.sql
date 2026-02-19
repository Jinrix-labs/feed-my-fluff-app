-- Migration: Add is_admin column to family_members table
-- Run this SQL in your Supabase SQL Editor

-- Add is_admin column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'family_members'
    AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE family_members
    ADD COLUMN is_admin BOOLEAN DEFAULT false NOT NULL;

    RAISE NOTICE 'Added column: is_admin to family_members';
  ELSE
    RAISE NOTICE 'Column is_admin already exists in family_members';
  END IF;
END $$;

-- Create index for better query performance (optional)
CREATE INDEX IF NOT EXISTS idx_family_members_is_admin ON family_members(is_admin);

