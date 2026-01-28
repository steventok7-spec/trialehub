-- Fix: Add missing DELETE policy for profiles table
-- This allows admins to delete employee profiles

-- Add delete policy for profiles table
create policy "Admins can delete profiles" on profiles
  for delete using ( is_admin() );
