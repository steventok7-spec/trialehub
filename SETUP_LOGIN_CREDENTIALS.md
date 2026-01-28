# Setup Login Credentials - Step by Step Guide

## Your Supabase Project
- **Project URL**: `https://zzvusbrlfullsglomqbs.supabase.co`
- **Project Reference**: `zzvusbrlfullsglomqbs`

---

## Step 1: Access Your Supabase Dashboard

1. Go to: **https://supabase.com/dashboard**
2. Sign in to your Supabase account
3. Select your project: `zzvusbrlfullsglomqbs`

---

## Step 2: Create/Check Owner Account

### Option A: Check if User Already Exists

1. In Supabase Dashboard, go to **Authentication** → **Users**
2. Look for a user with email: `steventok@sukhapku.com`
3. If it exists:
   - Click on the user
   - Click **"Send Password Recovery"** to reset the password
   - Check your email (`steventok@sukhapku.com`) for the reset link
   - Set a new password

### Option B: Create New Owner Account (if doesn't exist)

1. In Supabase Dashboard, go to **Authentication** → **Users**
2. Click **"Add User"** or **"Invite User"**
3. Fill in:
   - **Email**: `steventok@sukhapku.com`
   - **Password**: Choose a secure password (remember this!)
   - **Auto Confirm User**: ✅ Check this box (important!)
4. Click **"Create User"**.

---

## Step 3: Set Owner Role in Database

After creating/confirming the user exists, you need to set their role to 'owner':

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Copy and paste this SQL:

```sql
-- Update the user's role to 'owner'
UPDATE profiles 
SET role = 'owner' 
WHERE email = 'steventok@sukhapku.com';

-- Verify it worked
SELECT id, email, name, role 
FROM profiles 
WHERE email = 'steventok@sukhapku.com';
```

4. Click **"Run"** or press `Cmd/Ctrl + Enter`
5. You should see the user with `role = 'owner'` in the results

---

## Step 4: Run Database Migrations (if not done yet)

If you haven't run the migrations yet, run them in order:

1. In Supabase Dashboard → **SQL Editor**
2. Run each migration file in order:

### Migration 1: Owner Role Setup
Copy contents of `MIGRATION_001_OWNER_ROLE.sql` and run it

### Migration 2: Schedule Table
Copy contents of `MIGRATION_002_SCHEDULE_TABLE.sql` and run it

### Migration 3: Sick Auto-Approval
Copy contents of `MIGRATION_003_SICK_AUTO_APPROVAL.sql` and run it

### Migration 4: Enhanced Profiles
Copy contents of `MIGRATION_004_ENHANCED_PROFILES.sql` and run it

---

## Step 5: Test Login

1. Make sure your dev server is running:
   ```bash
   npm run dev
   ```

2. Open your browser to: **http://localhost:4200** (or the port shown in terminal)

3. Login with:
   - **Email**: `steventok@sukhapku.com`
   - **Password**: (the password you set in Step 2)

---

## Troubleshooting

### "Invalid credentials" error
- ✅ Make sure you're using the correct password
- ✅ Check that the user exists in Authentication → Users
- ✅ Try resetting the password via "Send Password Recovery"

### "Access denied: Not an owner account"
- ✅ Run the SQL query in Step 3 to set role to 'owner'
- ✅ Verify the email is exactly `steventok@sukhapku.com`

### "Profile not found" error
- ✅ The user exists in Authentication but not in the `profiles` table
- ✅ Check if the database trigger is working
- ✅ Manually create profile:
  ```sql
  INSERT INTO profiles (id, email, name, role)
  VALUES (
    (SELECT id FROM auth.users WHERE email = 'steventok@sukhapku.com'),
    'steventok@sukhapku.com',
    'Steven Tok',
    'owner'
  );
  ```

---

## Quick Reference

**Login Credentials:**
- Email: `steventok@sukhapku.com`
- Password: (set by you in Supabase Dashboard)

**Supabase Dashboard:** https://supabase.com/dashboard/project/zzvusbrlfullsglomqbs

**Local App:** http://localhost:4200

---

## Security Note

⚠️ **Never commit passwords to Git!** The password is stored securely in Supabase Authentication, not in your code. This is the correct and secure way to handle authentication.
