-- Enable Admins to view profiles in their own department
create policy "Admins can view profiles in their department"
on public.profiles for select
using (
  exists (
    select 1 from public.profiles admin_prof
    where admin_prof.id = auth.uid()
    and admin_prof.role = 'admin'
    and admin_prof.department_id = public.profiles.department_id
  )
);

-- Enable Admins to view attendance records in their own department
create policy "Admins can view attendance in their department"
on public.attendance_records for select
using (
  exists (
    select 1 from public.profiles admin_prof
    where admin_prof.id = auth.uid()
    and admin_prof.role = 'admin'
    and admin_prof.department_id = (
      select user_prof.department_id
      from public.profiles user_prof
      where user_prof.id = public.attendance_records.user_id
    )
  )
);

-- Enable Admins to view break records via attendance records
create policy "Admins can view break records in their department"
on public.break_records for select
using (
  exists (
    select 1 from public.attendance_records ar
    where ar.id = public.break_records.attendance_record_id
    and exists (
        select 1 from public.profiles admin_prof
        where admin_prof.id = auth.uid()
        and admin_prof.role = 'admin'
        and admin_prof.department_id = (
            select user_prof.department_id
            from public.profiles user_prof
            where user_prof.id = ar.user_id
        )
    )
  )
);
