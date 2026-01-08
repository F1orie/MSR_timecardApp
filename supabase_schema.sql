-- Enable Row Level Security (RLS) for all tables
-- Users should only be able to view/edit their own data (except Admins maybe later)

-- 1. PROFILES Table (Extends auth.users)
create table public.profiles (
  id uuid not null references auth.users(id) on delete cascade,
  full_name text,
  role text default 'employee' check (role in ('admin', 'employee')),
  hourly_wage integer default 1000,
  commuter_pass_route jsonb,
  created_at timestamptz default now(),
  primary key (id)
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
on public.profiles for select
using ( auth.uid() = id );

create policy "Users can update their own profile"
on public.profiles for update
using ( auth.uid() = id );

-- Trigger to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'employee');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. ATTENDANCE_LOGS Table
create table public.attendance_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  start_time timestamptz,
  end_time timestamptz,
  break_minutes integer default 0,
  status text default 'working' check (status in ('working', 'completed', 'absent')),
  created_at timestamptz default now()
);

alter table public.attendance_logs enable row level security;

create policy "Users can view their own attendance"
on public.attendance_logs for select
using ( auth.uid() = user_id );

create policy "Users can insert their own attendance"
on public.attendance_logs for insert
with check ( auth.uid() = user_id );

create policy "Users can update their own attendance"
on public.attendance_logs for update
using ( auth.uid() = user_id );


-- 3. TRANSPORTATION_EXPENSES Table
create table public.transportation_expenses (
  id uuid default gen_random_uuid() primary key,
  attendance_id uuid not null references public.attendance_logs(id) on delete cascade,
  route_description text,
  cost integer default 0,
  is_pass_covered boolean default false,
  created_at timestamptz default now()
);

alter table public.transportation_expenses enable row level security;

-- Policy: Accessible if the related attendance log belongs to the user
create policy "Users can manage their own transportation expenses"
on public.transportation_expenses for all
using (
  exists (
    select 1 from public.attendance_logs
    where public.attendance_logs.id = public.transportation_expenses.attendance_id
    and public.attendance_logs.user_id = auth.uid()
  )
);
