/*
  # Fix roles and user registration

  1. Changes
    - Ensure roles table has correct structure
    - Clean up any duplicate roles
    - Add unique constraint on role names
    - Update handle_new_user function with improved error handling
  
  2. Security
    - Maintains existing security model
    - Ensures proper role assignment for new users
*/

-- First ensure we have the roles table with proper structure
CREATE TABLE IF NOT EXISTS public.roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL
);

-- Clean up any duplicate roles, keeping the first one based on id
DELETE FROM public.roles a
WHERE a.ctid <> (
    SELECT MIN(b.ctid)
    FROM public.roles b
    WHERE a.name = b.name
);

-- Now we can safely add the unique constraint
ALTER TABLE public.roles
DROP CONSTRAINT IF EXISTS roles_name_key,
ADD CONSTRAINT roles_name_key UNIQUE (name);

-- Ensure we have our required roles
INSERT INTO public.roles (id, name)
SELECT gen_random_uuid(), 'designer'
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'designer');

INSERT INTO public.roles (id, name)
SELECT gen_random_uuid(), 'knitter'
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'knitter');

-- Improved handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  role_name text;
  role_id uuid;
BEGIN
  -- Insert into users table
  INSERT INTO public.users (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;

  -- Get role from metadata
  role_name := COALESCE(new.raw_user_meta_data->>'role', 'knitter');
    
  -- Get role ID
  SELECT id INTO role_id 
  FROM public.roles 
  WHERE name = role_name;

  IF role_id IS NULL THEN
    -- If specified role not found, default to knitter
    SELECT id INTO role_id 
    FROM public.roles 
    WHERE name = 'knitter';
    
    IF role_id IS NULL THEN
      RAISE EXCEPTION 'Required role "knitter" not found';
    END IF;
  END IF;

  -- Insert user role
  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (new.id, role_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;

  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create user: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();