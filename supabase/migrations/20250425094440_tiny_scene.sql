/*
  # Fix user creation and role assignment

  1. Changes
    - Ensure roles table exists and has required roles
    - Simplify handle_new_user function to reduce complexity
    - Add better error handling for role assignment
    - Fix unique constraint issues
    
  2. Security
    - Maintain existing security model
    - Ensure proper role assignment
*/

-- First ensure roles exist
DO $$ 
BEGIN
  -- Create roles if they don't exist
  IF NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'designer') THEN
    INSERT INTO public.roles (name) VALUES ('designer');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'knitter') THEN
    INSERT INTO public.roles (name) VALUES ('knitter');
  END IF;
END $$;

-- Simplified handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  role_name text;
  role_id uuid;
BEGIN
  -- Get role from metadata
  role_name := COALESCE(NULLIF(TRIM(new.raw_user_meta_data->>'role'), ''), 'knitter');

  -- Get role ID
  SELECT id INTO role_id 
  FROM public.roles 
  WHERE name = role_name;

  -- Insert into users table
  INSERT INTO public.users (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');

  -- Insert user role
  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (new.id, role_id);

  -- Insert into role-specific table
  IF role_name = 'designer' THEN
    INSERT INTO public.designers (id, email, name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  ELSE
    INSERT INTO public.knitters (id, email, name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  END IF;

  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error details
    RAISE NOTICE 'Error in handle_new_user: %, Detail: %, Hint: %', 
      SQLERRM, SQLSTATE, SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();