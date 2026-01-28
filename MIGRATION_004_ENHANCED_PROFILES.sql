-- =====================================================
-- MIGRATION 004: Enhanced Profile Fields
-- =====================================================
-- Adds missing fields to profiles and private_details tables
-- to support comprehensive employee data management.
--
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Add missing fields to profiles table
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- 2. Add enhanced fields to private_details table
ALTER TABLE private_details 
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS national_id text,
  ADD COLUMN IF NOT EXISTS emergency_contact_name text,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
  ADD COLUMN IF NOT EXISTS probation_end_date date,
  ADD COLUMN IF NOT EXISTS bank_name text;

-- 3. Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- 4. Update trigger to handle new fields (if needed)
-- The existing handle_new_user trigger should still work,
-- but we'll make it more robust

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  -- Insert profile with basic info
  INSERT INTO public.profiles (id, email, name, role, user_id)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', new.email), 
    'employee',
    new.id
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Insert private_details row
  INSERT INTO public.private_details (id) 
  VALUES (new.id)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Verification query
-- SELECT 
--   column_name, 
--   data_type, 
--   is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'profiles' 
--   AND column_name IN ('phone_number', 'date_of_birth', 'gender', 'start_date', 'user_id')
-- ORDER BY column_name;
