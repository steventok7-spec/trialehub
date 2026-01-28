-- =====================================================
-- MIGRATION 003: Sick Request Auto-Approval
-- =====================================================
-- Automatically approves sick requests upon insertion
-- to streamline the sick leave workflow.
--
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Create trigger function for auto-approval
CREATE OR REPLACE FUNCTION auto_approve_sick_requests()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-approve sick requests
  IF NEW.type = 'sick' AND NEW.status = 'pending' THEN
    NEW.status = 'approved';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sick_request_auto_approve ON requests;

-- 3. Create trigger on requests table
CREATE TRIGGER sick_request_auto_approve
  BEFORE INSERT ON requests
  FOR EACH ROW
  EXECUTE FUNCTION auto_approve_sick_requests();

-- 4. Verification: Insert a test sick request (optional)
-- INSERT INTO requests (employee_id, type, start_date, end_date, reason)
-- VALUES (auth.uid(), 'sick', CURRENT_DATE, CURRENT_DATE, 'Test sick request');
-- 
-- SELECT * FROM requests WHERE type = 'sick' ORDER BY created_at DESC LIMIT 1;
-- Expected: status should be 'approved'
