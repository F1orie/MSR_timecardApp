-- 4. TRANSPORTATION_RECORDS Table
create table if not exists public.transportation_records (
  id uuid default gen_random_uuid() primary key,
  attendance_record_id uuid not null references public.attendance_records(id) on delete cascade,
  origin text not null,
  destination text not null,
  transport_method text not null, -- e.g. "電車(千代田線)"
  route_type text not null check (route_type in ('片道', '往復')),
  amount integer not null default 0,
  created_at timestamptz default now()
);

alter table public.transportation_records enable row level security;

-- Policies
drop policy if exists "Users can view their own transportation" on public.transportation_records;
create policy "Users can view their own transportation"
on public.transportation_records for select
using (
  exists (
    select 1 from public.attendance_records
    where public.attendance_records.id = public.transportation_records.attendance_record_id
    and public.attendance_records.user_id = auth.uid()
  )
);

drop policy if exists "Users can manage their own transportation" on public.transportation_records;
create policy "Users can manage their own transportation"
on public.transportation_records for all
using (
  exists (
    select 1 from public.attendance_records
    where public.attendance_records.id = public.transportation_records.attendance_record_id
    and public.attendance_records.user_id = auth.uid()
  )
);

drop policy if exists "Admins can view transportation in their department" on public.transportation_records;
create policy "Admins can view transportation in their department"
on public.transportation_records for select
using (
  exists (
    select 1 from public.attendance_records
    join public.profiles target_profile on public.attendance_records.user_id = target_profile.id
    join public.profiles admin_profile on target_profile.department_id = admin_profile.department_id
    where public.attendance_records.id = public.transportation_records.attendance_record_id
    and admin_profile.id = auth.uid()
    and admin_profile.role = 'admin'
  )
);

drop policy if exists "Admins can manage transportation in their department" on public.transportation_records;
create policy "Admins can manage transportation in their department"
on public.transportation_records for all
using (
  exists (
    select 1 from public.attendance_records
    join public.profiles target_profile on public.attendance_records.user_id = target_profile.id
    join public.profiles admin_profile on target_profile.department_id = admin_profile.department_id
    where public.attendance_records.id = public.transportation_records.attendance_record_id
    and admin_profile.id = auth.uid()
    and admin_profile.role = 'admin'
  )
);
