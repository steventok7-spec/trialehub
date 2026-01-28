-- =====================================================
-- MIGRATION 002: Schedule Table Creation
-- =====================================================
-- Creates schedule table for employee shift management
-- with proper RLS policies.
--
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Create shift type enum
DO $$ BEGIN
  CREATE TYPE shift_type_enum AS ENUM ('morning', 'afternoon', 'full_day');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create schedule table
CREATE TABLE IF NOT EXISTS schedule (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  shift shift_type_enum NOT NULL,
  start_time time,
  end_time time,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, date, shift)
);

-- 3. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_schedule_updated_at ON schedule;
CREATE TRIGGER update_schedule_updated_at
  BEFORE UPDATE ON schedule
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Enable RLS
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
DROP POLICY IF EXISTS "Employees see own schedule" ON schedule;
CREATE POLICY "Employees see own schedule" ON schedule
  FOR SELECT USING (auth.uid() = employee_id);

DROP POLICY IF EXISTS "Owners see all schedules" ON schedule;
CREATE POLICY "Owners see all schedules" ON schedule
  FOR SELECT USING (is_owner());

DROP POLICY IF EXISTS "Owners can manage schedules" ON schedule;
CREATE POLICY "Owners can manage schedules" ON schedule
  FOR ALL USING (is_owner());

-- 6. Create index for performance
CREATE INDEX IF NOT EXISTS idx_schedule_employee_date 
  ON schedule(employee_id, date);

-- 7. Verification query
-- SELECT * FROM schedule LIMIT 5;
