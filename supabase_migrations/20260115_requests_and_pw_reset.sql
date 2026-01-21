-- Add password_reset_required to profiles
alter table public.profiles 
add column if not exists password_reset_required boolean default false;

-- Create requests table
create table if not exists public.requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('password', 'attendance', 'other')),
  content text not null,
  status text not null default 'pending' check (status in ('pending', 'completed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.requests enable row level security;

-- Policies for requests

-- Users can view their own requests
create policy "Users can view their own requests"
on public.requests for select
using ( auth.uid() = user_id );

-- Users can insert their own requests
create policy "Users can insert their own requests"
on public.requests for insert
with check ( auth.uid() = user_id );

-- Admins can view all requests in their department
create policy "Admins can view requests in their department"
on public.requests for select
using (
  exists (
    select 1 from public.profiles admin_profile
    join public.profiles target_profile on admin_profile.department_id = target_profile.department_id
    where admin_profile.id = auth.uid()
    and admin_profile.role = 'admin'
    and target_profile.id = public.requests.user_id
  )
);

-- Admins can update requests in their department
create policy "Admins can update requests in their department"
on public.requests for update
using (
  exists (
    select 1 from public.profiles admin_profile
    join public.profiles target_profile on admin_profile.department_id = target_profile.department_id
    where admin_profile.id = auth.uid()
    and admin_profile.role = 'admin'
    and target_profile.id = public.requests.user_id
  )
);
