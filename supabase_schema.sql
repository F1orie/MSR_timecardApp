-- Enable Row Level Security (RLS) for all tables

-- 0. DEPARTMENTS Table
create table if not exists public.departments (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  code text not null unique,
  created_at timestamptz default now()
);

alter table public.departments enable row level security;

-- Allow read access to authenticated users (needed for login/lookup?) 
-- Actually for login we might need unchecked access or a helper function. 
-- For now allow read for authenticated.
drop policy if exists "Authenticated users can view departments" on public.departments;
create policy "Authenticated users can view departments"
on public.departments for select
to authenticated
using ( true );

-- Helper function to check admin status (Security Definer to bypass RLS recursion)
create or replace function public.is_admin_in_same_dept(target_dept_id uuid)
returns boolean as $$
begin
  return exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and department_id = target_dept_id
  );
end;
$$ language plpgsql security definer;

-- 1. PROFILES Table (Extends auth.users)
-- Managed via Triggers on auth.users
create table if not exists public.profiles (
  id uuid not null references auth.users(id) on delete cascade,
  username text, -- Removed unique constraint here
  contact_email text,
  department_id uuid references public.departments(id),
  full_name text,
  role text default 'employee' check (role in ('admin', 'employee')),
  hourly_wage integer default 1000,
  commuter_pass_price integer default 0, -- Monthly commuter pass cost
  created_at timestamptz default now(),
  primary key (id),
  unique (username, department_id) -- Added composite unique constraint
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
on public.profiles for select
using ( auth.uid() = id );

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update
using ( auth.uid() = id );

drop policy if exists "Admins can view profiles in their department" on public.profiles;
create policy "Admins can view profiles in their department"
on public.profiles for select
using (
  auth.uid() != id
  and public.is_admin_in_same_dept(department_id)
);

drop policy if exists "Admins can update profiles in their department" on public.profiles;
create policy "Admins can update profiles in their department"
on public.profiles for update
using (
  auth.uid() != id
  and public.is_admin_in_same_dept(department_id)
);

-- Trigger to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, username, contact_email, department_id)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    'employee',
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'contact_email',
    (select id from public.departments where code = new.raw_user_meta_data->>'department_code')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. ATTENDANCE_RECORDS Table
create table if not exists public.attendance_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null default current_date,
  clock_in timestamptz,
  clock_out timestamptz,
  transport_route text, -- Manual entry for route (e.g., "Shinjuku -> Shibuya")
  transport_cost integer default 0, -- Manual entry for cost
  created_at timestamptz default now()
);

alter table public.attendance_records enable row level security;

drop policy if exists "Users can view their own attendance" on public.attendance_records;
create policy "Users can view their own attendance"
on public.attendance_records for select
using ( auth.uid() = user_id );

-- Allow users to insert their own records
drop policy if exists "Users can insert their own attendance" on public.attendance_records;
create policy "Users can insert their own attendance"
on public.attendance_records for insert
with check ( auth.uid() = user_id );

-- Allow users to update their own records
drop policy if exists "Users can update their own attendance" on public.attendance_records;
create policy "Users can update their own attendance"
on public.attendance_records for update
using ( auth.uid() = user_id );

drop policy if exists "Admins can view attendance in their department" on public.attendance_records;
create policy "Admins can view attendance in their department"
on public.attendance_records for select
using (
  exists (
    select 1 from public.profiles admin_profile
    join public.profiles target_profile on admin_profile.department_id = target_profile.department_id
    where admin_profile.id = auth.uid()
    and admin_profile.role = 'admin'
    and target_profile.id = public.attendance_records.user_id
  )
);

drop policy if exists "Admins can manage attendance in their department" on public.attendance_records;
create policy "Admins can manage attendance in their department"
on public.attendance_records for all
using (
  exists (
    select 1 from public.profiles admin_profile
    join public.profiles target_profile on admin_profile.department_id = target_profile.department_id
    where admin_profile.id = auth.uid()
    and admin_profile.role = 'admin'
    and target_profile.id = public.attendance_records.user_id
  )
);


-- 3. BREAK_RECORDS Table
-- Supports multiple breaks per day
create table if not exists public.break_records (
  id uuid default gen_random_uuid() primary key,
  attendance_record_id uuid not null references public.attendance_records(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz,
  created_at timestamptz default now()
);

alter table public.break_records enable row level security;

drop policy if exists "Users can view their own breaks" on public.break_records;
create policy "Users can view their own breaks"
on public.break_records for select
using (
  exists (
    select 1 from public.attendance_records
    where public.attendance_records.id = public.break_records.attendance_record_id
    and public.attendance_records.user_id = auth.uid()
  )
);

drop policy if exists "Users can manage their own breaks" on public.break_records;
create policy "Users can manage their own breaks"
on public.break_records for all
using (
  exists (
    select 1 from public.attendance_records
    where public.attendance_records.id = public.break_records.attendance_record_id
    and public.attendance_records.user_id = auth.uid()
  )
);

drop policy if exists "Admins can view breaks in their department" on public.break_records;
create policy "Admins can view breaks in their department"
on public.break_records for select
using (
  exists (
    select 1 from public.attendance_records
    join public.profiles target_profile on public.attendance_records.user_id = target_profile.id
    join public.profiles admin_profile on target_profile.department_id = admin_profile.department_id
    where public.attendance_records.id = public.break_records.attendance_record_id
    and admin_profile.id = auth.uid()
    and admin_profile.role = 'admin'
  )
);

drop policy if exists "Admins can manage breaks in their department" on public.break_records;
create policy "Admins can manage breaks in their department"
on public.break_records for all
using (
  exists (
    select 1 from public.attendance_records
    join public.profiles target_profile on public.attendance_records.user_id = target_profile.id
    join public.profiles admin_profile on target_profile.department_id = admin_profile.department_id
    where public.attendance_records.id = public.break_records.attendance_record_id
    and admin_profile.id = auth.uid()
    and admin_profile.role = 'admin'
  )
);
