/*
  # Fix user signup and role assignment

  1. Changes
    - Ensure tables exist with correct structure
    - Add proper constraints and indexes
    - Improve error handling in handle_new_user function
    - Add debugging logs
  
  2. Security
    - Maintain existing security model
    - Ensure proper role assignment
*/

-- First ensure we have the users table with proper structure
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY,
    email text NOT NULL,
    full_name text,
    CONSTRAINT users_email_key UNIQUE (email)
);

-- Ensure we have the roles table with proper structure
CREATE TABLE IF NOT EXISTS public.roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    CONSTRAINT roles_name_key UNIQUE (name)
);

-- Ensure we have the user_roles table with proper structure
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id)
        REFERENCES public.roles(id) ON DELETE CASCADE
);

-- Clean up any existing roles to prevent duplicates
DELETE FROM public.roles a
WHERE a.ctid <> (
    SELECT MIN(b.ctid)
    FROM public.roles b
    WHERE a.name = b.name
);

-- Ensure required roles exist
INSERT INTO public.roles (id, name)
SELECT gen_random_uuid(), 'designer'
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'designer');

INSERT INTO public.roles (id, name)
SELECT gen_random_uuid(), 'knitter'
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'knitter');

-- Improved handle_new_user function with better error handling and logging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  role_name text;
  role_id uuid;
BEGIN
  -- Log incoming data for debugging
  RAISE NOTICE 'Creating new user with id: %, email: %, metadata: %',
    new.id, new.email, new.raw_user_meta_data;

  -- Insert into users table with better error handling
  BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
    
    RAISE NOTICE 'Successfully created user record';
  EXCEPTION 
    WHEN unique_violation THEN
      RAISE NOTICE 'User record already exists, continuing with role assignment';
    WHEN OTHERS THEN
      RAISE NOTICE 'Error creating user record: %', SQLERRM;
      RAISE;
  END;

  -- Get role from metadata with logging
  role_name := COALESCE(new.raw_user_meta_data->>'role', 'knitter');
  RAISE NOTICE 'Assigning role: %', role_name;
    
  -- Get role ID with error handling
  SELECT id INTO role_id 
  FROM public.roles 
  WHERE name = role_name;

  IF role_id IS NULL THEN
    RAISE NOTICE 'Role % not found, defaulting to knitter', role_name;
    
    -- Default to knitter role
    SELECT id INTO role_id 
    FROM public.roles 
    WHERE name = 'knitter';
    
    IF role_id IS NULL THEN
      RAISE EXCEPTION 'Critical error: Required role "knitter" not found';
    END IF;
  END IF;

  -- Insert user role with error handling
  BEGIN
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (new.id, role_id);
    
    RAISE NOTICE 'Successfully assigned role % to user %', role_name, new.id;
  EXCEPTION 
    WHEN unique_violation THEN
      RAISE NOTICE 'Role assignment already exists for user %', new.id;
    WHEN OTHERS THEN
      RAISE NOTICE 'Error assigning role: %', SQLERRM;
      RAISE;
  END;

  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Unhandled error in handle_new_user: %', SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();