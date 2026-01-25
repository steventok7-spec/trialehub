
-- 1. Create Enumerations
CREATE TYPE job_title_enum AS ENUM ('commis_kitchen', 'barista', 'steward', 'commis_pastry', 'fnb_service', 'manager');
CREATE TYPE emp_type_enum AS ENUM ('full_time', 'part_time');
CREATE TYPE emp_status_enum AS ENUM ('active', 'inactive');
CREATE TYPE request_status_enum AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE request_type_enum AS ENUM ('leave', 'sick', 'claim');

-- 2. Profiles (Publicly visible to authenticated users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  name text,
  role text default 'employee', -- 'admin' or 'employee'
  job_title job_title_enum,
  employment_type emp_type_enum,
  status emp_status_enum default 'active',
  birthday date,
  joining_date date,
  created_at timestamptz default now()
);

-- 3. Private Details (Sensitive data: Salary, Bank. ADMIN ONLY)
create table private_details (
  id uuid references profiles(id) on delete cascade primary key,
  bank_name text,
  bank_account_number text,
  monthly_salary_idr numeric default 0,
  hourly_rate_idr numeric default 0
);

-- 4. Attendance
create table attendance (
  id uuid default gen_random_uuid() primary key,
  employee_id uuid references profiles(id),
  date date,
  check_in timestamptz,
  check_out timestamptz,
  total_minutes int,
  created_at timestamptz default now()
);

-- 5. Requests (Leave, Sick, Claims)
create table requests (
  id uuid default gen_random_uuid() primary key,
  employee_id uuid references profiles(id),
  type request_type_enum,
  status request_status_enum default 'pending',
  start_date date,
  end_date date,
  reason text,
  amount numeric, -- for claims
  created_at timestamptz default now()
);

-- 6. Row Level Security (RLS)

-- Enable RLS
alter table profiles enable row level security;
alter table private_details enable row level security;
alter table attendance enable row level security;
alter table requests enable row level security;

-- Function to check if user is admin
create or replace function is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- Profiles Policies
create policy "Public profiles are viewable by everyone" on profiles
  for select using ( auth.role() = 'authenticated' );

create policy "Admins can update profiles" on profiles
  for update using ( is_admin() );

-- Private Details Policies (STRICT)
create policy "Admins can view private details" on private_details
  for select using ( is_admin() );

create policy "Admins can update private details" on private_details
  for all using ( is_admin() );

-- Attendance Policies
create policy "Users see own attendance" on attendance
  for select using ( auth.uid() = employee_id );

create policy "Admins see all attendance" on attendance
  for select using ( is_admin() );

create policy "Users can insert own attendance" on attendance
  for insert with check ( auth.uid() = employee_id );

create policy "Users can update own attendance (checkout)" on attendance
  for update using ( auth.uid() = employee_id );

-- Requests Policies
create policy "Users see own requests" on requests
  for select using ( auth.uid() = employee_id );

create policy "Admins see all requests" on requests
  for select using ( is_admin() );

create policy "Users can insert requests" on requests
  for insert with check ( auth.uid() = employee_id );

create policy "Admins can update request status" on requests
  for update using ( is_admin() );

-- 7. Trigger to create profile on signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'name', 'employee');
  
  insert into public.private_details (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
