/*
  # Fix user signup and role assignment

  1. Tables and Constraints
    - Ensure users table exists with proper constraints
    - Ensure roles table exists with proper constraints
    - Ensure user_roles table exists with proper constraints
  
  2. Data
    - Insert required roles if they don't exist
    
  3. Functions
    - Update handle_new_user function with proper error handling
*/

-- First ensure we have the users table with proper structure
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY,
    email text NOT NULL UNIQUE,
    full_name text
);

-- Ensure we have the roles table with proper structure
CREATE TABLE IF NOT EXISTS public.roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE
);

-- Ensure we have the user_roles table with proper structure
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    role_id uuid REFERENCES public.roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Clean up any duplicate roles, keeping the first one based on id
DELETE FROM public.roles a
WHERE a.ctid <> (
    SELECT MIN(b.ctid)
    FROM public.roles b
    WHERE a.name = b.name
);

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
  BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  EXCEPTION 
    WHEN unique_violation THEN
      -- Skip if user already exists
      NULL;
  END;

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
  BEGIN
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (new.id, role_id);
  EXCEPTION 
    WHEN unique_violation THEN
      -- Skip if role assignment already exists
      NULL;
  END;

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