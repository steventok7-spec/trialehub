-- ============================================================================
-- BULK EMPLOYEE IMPORT SCRIPT FOR SUPABASE
-- ============================================================================
-- This script allows you to add multiple employees at once to your database.
-- 
-- INSTRUCTIONS:
-- 1. Open your Supabase dashboard: https://supabase.com/dashboard
-- 2. Go to SQL Editor (left sidebar)
-- 3. Copy and paste this entire script
-- 4. Modify the employee data below (or add more INSERT statements)
-- 5. Click "Run" to execute
--
-- IMPORTANT NOTES:
-- - This bypasses Supabase Auth (no email confirmation needed)
-- - You'll need to create auth users separately OR use the app's "Add Employee" feature
-- - For production, it's better to use the app's UI to ensure auth users are created
-- - This is best for initial data seeding or testing
-- ============================================================================
-- Example 1: Full-time Kitchen Staff
INSERT INTO profiles (
        id,
        email,
        name,
        role,
        job_title,
        employment_type,
        status,
        phone_number,
        date_of_birth,
        gender,
        start_date
    )
VALUES (
        gen_random_uuid(),
        'john.doe@example.com',
        'John Doe',
        'employee',
        'commis_kitchen',
        'full_time',
        'active',
        '+62812345678',
        '1990-01-15',
        'male',
        '2024-01-01'
    );
-- Get the last inserted ID for private details
INSERT INTO private_details (
        id,
        monthly_salary_idr,
        address,
        national_id,
        emergency_contact_name,
        emergency_contact_phone
    )
VALUES (
        (
            SELECT id
            FROM profiles
            WHERE email = 'john.doe@example.com'
        ),
        5000000,
        'Jl. Example No. 123, Jakarta',
        '1234567890123456',
        'Jane Doe',
        '+62898765432'
    );
-- Example 2: Part-time Barista
INSERT INTO profiles (
        id,
        email,
        name,
        role,
        job_title,
        employment_type,
        status,
        phone_number,
        date_of_birth,
        gender,
        start_date
    )
VALUES (
        gen_random_uuid(),
        'jane.smith@example.com',
        'Jane Smith',
        'employee',
        'barista',
        'part_time',
        'active',
        '+62823456789',
        '1995-05-20',
        'female',
        '2024-02-01'
    );
INSERT INTO private_details (
        id,
        hourly_rate_idr,
        address,
        national_id,
        emergency_contact_name,
        emergency_contact_phone
    )
VALUES (
        (
            SELECT id
            FROM profiles
            WHERE email = 'jane.smith@example.com'
        ),
        50000,
        'Jl. Coffee Street No. 45, Jakarta',
        '9876543210987654',
        'John Smith',
        '+62887654321'
    );
-- Example 3: Full-time Steward
INSERT INTO profiles (
        id,
        email,
        name,
        role,
        job_title,
        employment_type,
        status,
        phone_number,
        date_of_birth,
        gender,
        start_date
    )
VALUES (
        gen_random_uuid(),
        'mike.johnson@example.com',
        'Mike Johnson',
        'employee',
        'steward',
        'full_time',
        'active',
        '+62834567890',
        '1988-08-10',
        'male',
        '2023-06-15'
    );
INSERT INTO private_details (
        id,
        monthly_salary_idr,
        address,
        national_id,
        emergency_contact_name,
        emergency_contact_phone,
        probation_end_date
    )
VALUES (
        (
            SELECT id
            FROM profiles
            WHERE email = 'mike.johnson@example.com'
        ),
        4500000,
        'Jl. Service Road No. 78, Jakarta',
        '1122334455667788',
        'Sarah Johnson',
        '+62876543210',
        '2023-09-15'
    );
-- Example 4: Manager
INSERT INTO profiles (
        id,
        email,
        name,
        role,
        job_title,
        employment_type,
        status,
        phone_number,
        date_of_birth,
        gender,
        start_date
    )
VALUES (
        gen_random_uuid(),
        'emily.wong@example.com',
        'Emily Wong',
        'employee',
        'manager',
        'full_time',
        'active',
        '+62867890123',
        '1985-07-18',
        'female',
        '2022-01-01'
    );
INSERT INTO private_details (
        id,
        monthly_salary_idr,
        address,
        national_id,
        emergency_contact_name,
        emergency_contact_phone
    )
VALUES (
        (
            SELECT id
            FROM profiles
            WHERE email = 'emily.wong@example.com'
        ),
        8000000,
        'Jl. Management St No. 34, Jakarta',
        '4455667788990011',
        'Tom Wong',
        '+62843210987'
    );
-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these after the inserts to verify the data was added correctly
-- Check all employees
SELECT id,
    name,
    email,
    job_title,
    employment_type,
    status
FROM profiles
ORDER BY name;
-- Check employee details with salary info
SELECT p.name,
    p.email,
    p.job_title,
    p.employment_type,
    pd.monthly_salary_idr,
    pd.hourly_rate_idr
FROM profiles p
    LEFT JOIN private_details pd ON p.id = pd.id
ORDER BY p.name;
-- ============================================================================
-- NOTES
-- ============================================================================
-- Job Titles (must use these exact values):
--   - commis_kitchen
--   - barista
--   - steward
--   - commis_pastry
--   - fnb_service
--   - manager
--
-- Employment Types:
--   - full_time
--   - part_time
--
-- Status:
--   - active
--   - inactive
--
-- ⚠️ IMPORTANT: These employees won't have auth credentials!
-- To allow them to log in, you need to either:
-- 1. Use the app's "Add Employee" feature (recommended)
-- 2. Create auth users manually in Supabase Auth dashboard
-- 3. Use this for testing/demo data only
-- ============================================================================