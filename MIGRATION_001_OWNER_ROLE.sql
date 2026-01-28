-- =====================================================
-- MIGRATION 001: Admin to Owner Role Migration
-- =====================================================
-- This migration updates the role system from 'admin' to 'owner'
-- and ensures only steventok@sukhapku.com has owner privileges.
--
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Update existing admin to owner
UPDATE profiles 
SET role = 'owner' 
WHERE role = 'admin' 
  AND email = 'steventok@sukhapku.com';

-- 2. Create is_owner function (replaces is_admin)
CREATE OR REPLACE FUNCTION is_owner()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() 
      AND role = 'owner'
      AND email = 'steventok@sukhapku.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update all RLS policies to use is_owner()

-- Profiles policies
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
CREATE POLICY "Owners can update profiles" ON profiles
  FOR UPDATE USING (is_owner());

DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
CREATE POLICY "Owners can insert profiles" ON profiles
  FOR INSERT WITH CHECK (is_owner());

DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
CREATE POLICY "Owners can delete profiles" ON profiles
  FOR DELETE USING (is_owner());

-- Private details policies
DROP POLICY IF EXISTS "Admins can view private details" ON private_details;
CREATE POLICY "Owners can view private details" ON private_details
  FOR SELECT USING (is_owner());

DROP POLICY IF EXISTS "Admins can update private details" ON private_details;
DROP POLICY IF EXISTS "Admins can manage private details" ON private_details;
CREATE POLICY "Owners can manage private details" ON private_details
  FOR ALL USING (is_owner());

-- Attendance policies
DROP POLICY IF EXISTS "Admins see all attendance" ON attendance;
CREATE POLICY "Owners see all attendance" ON attendance
  FOR SELECT USING (is_owner());

DROP POLICY IF EXISTS "Owners can manage attendance" ON attendance;
CREATE POLICY "Owners can manage attendance" ON attendance
  FOR ALL USING (is_owner());

-- Requests policies
DROP POLICY IF EXISTS "Admins see all requests" ON requests;
CREATE POLICY "Owners see all requests" ON requests
  FOR SELECT USING (is_owner());

DROP POLICY IF EXISTS "Admins can update request status" ON requests;
CREATE POLICY "Owners can update request status" ON requests
  FOR UPDATE USING (is_owner());

-- 4. Drop old is_admin function with CASCADE to remove any remaining dependencies
DROP FUNCTION IF EXISTS is_admin() CASCADE;

-- 5. Verification query (run this to confirm migration)
-- SELECT email, role FROM profiles WHERE role IN ('admin', 'owner');
