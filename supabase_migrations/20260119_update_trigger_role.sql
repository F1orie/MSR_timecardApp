-- Update the handle_new_user function to set default role to 'member' instead of 'employee'
-- This replaces the existing function content
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, username, contact_email, department_id)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    'member', -- Changed from 'employee' to 'member'
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'contact_email',
    (select id from public.departments where code = new.raw_user_meta_data->>'department_code')
  );
  return new;
end;
$$ language plpgsql security definer;
