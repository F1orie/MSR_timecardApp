-- Drop the existing check constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Migrate existing 'employee' roles to 'member'
UPDATE public.profiles SET role = 'member' WHERE role = 'employee';

-- Add the new check constraint
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'member', 'arbeit', 'intern'));

-- Update the default value
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'member';
