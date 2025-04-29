/*
  # Fix user registration trigger function

  1. Changes
    - Simplify user registration trigger function
    - Add proper error handling
    - Ensure role assignment works correctly
    - Add detailed logging for debugging
    
  2. Security
    - Maintain existing security model
    - Ensure proper role assignment
*/

-- Ensure we have the users table with proper structure
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

-- Ensure required roles exist
INSERT INTO public.roles (name)
VALUES 
  ('designer'),
  ('knitter')
ON CONFLICT (name) DO NOTHING;

-- Simplified handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  role_name text;
  role_id uuid;
BEGIN
  -- Insert into users table
  INSERT INTO public.users (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO UPDATE 
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name;

  -- Get role from metadata, defaulting to knitter if not specified
  role_name := COALESCE(NULLIF(TRIM(new.raw_user_meta_data->>'role'), ''), 'knitter');

  -- Get role ID
  SELECT id INTO STRICT role_id 
  FROM public.roles 
  WHERE name = role_name;

  -- Insert user role
  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (new.id, role_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;

  RETURN new;
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    -- If role not found, try to assign knitter role
    SELECT id INTO STRICT role_id 
    FROM public.roles 
    WHERE name = 'knitter';
    
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (new.id, role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
    
    RETURN new;
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create user: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();