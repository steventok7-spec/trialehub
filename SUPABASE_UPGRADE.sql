
-- IDEMPOTENT MIGRATION SCRIPT
-- Safe to run multiple times.

-- 1. ENHANCE PROFILES
DO $$ 
BEGIN 
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth date;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS start_date date;

    -- Add constraint if not exists (a bit complex to check, so we skip check or drop/add)
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_gender;
    ALTER TABLE public.profiles ADD CONSTRAINT check_gender CHECK (gender IN ('male', 'female', 'other'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
END $$;

-- 2. ENHANCE PRIVATE_DETAILS
DO $$ 
BEGIN 
    ALTER TABLE public.private_details ADD COLUMN IF NOT EXISTS address text;
    ALTER TABLE public.private_details ADD COLUMN IF NOT EXISTS national_id text;
    ALTER TABLE public.private_details ADD COLUMN IF NOT EXISTS emergency_contact_name text;
    ALTER TABLE public.private_details ADD COLUMN IF NOT EXISTS emergency_contact_phone text;
    ALTER TABLE public.private_details ADD COLUMN IF NOT EXISTS probation_end_date date;
EXCEPTION
    WHEN undefined_table THEN 
        RAISE NOTICE 'Table private_details does not exist. Ensure database_setup.md was run.';
END $$;

-- 3. NOTIFICATIONS TABLE
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

-- 4. RLS POLICIES (Drop first to avoid collision)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
CREATE POLICY "Authenticated users can create notifications" ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
