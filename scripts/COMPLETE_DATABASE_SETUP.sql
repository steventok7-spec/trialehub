-- ============================================================================
-- COMPLETE DATABASE SETUP FOR EHUBSUKHA
-- ============================================================================
-- This script combines the initial setup and all necessary upgrades.
-- It is safe to run on a new project or an existing one.

-- 1. Create Enumerations (if they don't exist)
DO $$ BEGIN
    CREATE TYPE job_title_enum AS ENUM ('commis_kitchen', 'barista', 'steward', 'commis_pastry', 'fnb_service', 'manager');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE emp_type_enum AS ENUM ('full_time', 'part_time');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE emp_status_enum AS ENUM ('active', 'inactive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE request_status_enum AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE request_type_enum AS ENUM ('leave', 'sick', 'claim');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text,
  name text,
  role text DEFAULT 'employee',
  job_title job_title_enum,
  employment_type emp_type_enum,
  status emp_status_enum DEFAULT 'active',
  birthday date,
  joining_date date,
  created_at timestamptz DEFAULT now()
);

-- Add Enhancements to Profiles
DO $$ BEGIN 
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth date;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS start_date date;

    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_gender;
    ALTER TABLE public.profiles ADD CONSTRAINT check_gender CHECK (gender IN ('male', 'female', 'other'));
EXCEPTION WHEN others THEN NULL; END $$;

-- 3. Private Details Table
CREATE TABLE IF NOT EXISTS public.private_details (
  id uuid REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  bank_name text,
  bank_account_number text,
  monthly_salary_idr numeric DEFAULT 0,
  hourly_rate_idr numeric DEFAULT 0
);

-- Add Enhancements to Private Details
DO $$ BEGIN 
    ALTER TABLE public.private_details ADD COLUMN IF NOT EXISTS address text;
    ALTER TABLE public.private_details ADD COLUMN IF NOT EXISTS national_id text;
    ALTER TABLE public.private_details ADD COLUMN IF NOT EXISTS emergency_contact_name text;
    ALTER TABLE public.private_details ADD COLUMN IF NOT EXISTS emergency_contact_phone text;
    ALTER TABLE public.private_details ADD COLUMN IF NOT EXISTS probation_end_date date;
EXCEPTION WHEN others THEN NULL; END $$;

-- 4. Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date,
  check_in timestamptz,
  check_out timestamptz,
  total_minutes int,
  created_at timestamptz DEFAULT now()
);

-- 5. Requests Table
CREATE TABLE IF NOT EXISTS public.requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  type request_type_enum,
  status request_status_enum DEFAULT 'pending',
  start_date date,
  end_date date,
  reason text,
  amount numeric,
  created_at timestamptz DEFAULT now()
);

-- 6. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    icon text,
    created_at timestamptz DEFAULT now(),
    is_read boolean DEFAULT false
);

-- 7. RLS Setup
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper function for Admin check
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies (Basic set, safe to run)
DO $$ BEGIN
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
    CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING ( auth.role() = 'authenticated' );

    DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
    CREATE POLICY "Admins can update profiles" ON public.profiles FOR ALL USING ( is_admin() );

    DROP POLICY IF EXISTS "Admins can view private details" ON public.private_details;
    CREATE POLICY "Admins can view private details" ON public.private_details FOR SELECT USING ( is_admin() );

    DROP POLICY IF EXISTS "Admins can update private details" ON public.private_details;
    CREATE POLICY "Admins can update private details" ON public.private_details FOR ALL USING ( is_admin() );

    -- Notifications policies
    DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
    CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
    CREATE POLICY "Authenticated users can create notifications" ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

    DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
    CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN others THEN NULL; END $$;

-- 8. Auth Trigger (Create Profile on Sign Up)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name', 'employee');
  
  INSERT INTO public.private_details (id) VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
