-- Enable Row Level Security (RLS) for all tables

-- 1. PROFILES Table (Extends auth.users)
-- Managed via Triggers on auth.users
create table public.profiles (
  id uuid not null references auth.users(id) on delete cascade,
  full_name text,
  role text default 'employee' check (role in ('admin', 'employee')),
  hourly_wage integer default 1000,
  commuter_pass_price integer default 0, -- Monthly commuter pass cost
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


-- 2. ATTENDANCE_RECORDS Table
create table public.attendance_records (
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

create policy "Users can view their own attendance"
on public.attendance_records for select
using ( auth.uid() = user_id );

-- Allow users to insert their own records
create policy "Users can insert their own attendance"
on public.attendance_records for insert
with check ( auth.uid() = user_id );

-- Allow users to update their own records
create policy "Users can update their own attendance"
on public.attendance_records for update
using ( auth.uid() = user_id );


-- 3. BREAK_RECORDS Table
-- Supports multiple breaks per day
create table public.break_records (
  id uuid default gen_random_uuid() primary key,
  attendance_record_id uuid not null references public.attendance_records(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz,
  created_at timestamptz default now()
);

alter table public.break_records enable row level security;

create policy "Users can view their own breaks"
on public.break_records for select
using (
  exists (
    select 1 from public.attendance_records
    where public.attendance_records.id = public.break_records.attendance_record_id
    and public.attendance_records.user_id = auth.uid()
  )
);

create policy "Users can manage their own breaks"
on public.break_records for all
using (
  exists (
    select 1 from public.attendance_records
    where public.attendance_records.id = public.break_records.attendance_record_id
    and public.attendance_records.user_id = auth.uid()
  )
);
