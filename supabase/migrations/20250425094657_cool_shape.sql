/*
  # Fix user creation with improved error handling

  1. Changes
    - Add ON CONFLICT clauses to handle duplicate entries gracefully
    - Improve error handling for role assignment
    - Add proper transaction handling
    - Add detailed error logging
    
  2. Security
    - Maintains existing security model
    - Ensures data consistency during user creation
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

-- Improved handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  role_name text;
  role_id uuid;
BEGIN
  -- Get role from metadata with proper default handling
  role_name := COALESCE(NULLIF(TRIM(new.raw_user_meta_data->>'role'), ''), 'knitter');
  
  -- Get role ID with error handling
  SELECT id INTO role_id 
  FROM public.roles 
  WHERE name = role_name;
  
  IF role_id IS NULL THEN
    -- If invalid role specified, default to knitter
    SELECT id INTO role_id 
    FROM public.roles 
    WHERE name = 'knitter';
    
    IF role_id IS NULL THEN
      RAISE EXCEPTION 'Critical error: Required role "knitter" not found';
    END IF;
    
    -- Log the role fallback
    RAISE NOTICE 'Invalid role % specified, defaulting to knitter', role_name;
    role_name := 'knitter';
  END IF;

  -- Insert into users table with conflict handling
  INSERT INTO public.users (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO UPDATE 
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name;

  -- Insert user role with conflict handling
  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (new.id, role_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;

  -- Insert into role-specific table based on role
  IF role_name = 'designer' THEN
    INSERT INTO public.designers (id, email, name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
    ON CONFLICT (id) DO UPDATE 
      SET email = EXCLUDED.email,
          name = EXCLUDED.name;
  ELSE
    INSERT INTO public.knitters (id, email, name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
    ON CONFLICT (id) DO UPDATE 
      SET email = EXCLUDED.email,
          name = EXCLUDED.name;
  END IF;

  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log detailed error information
    RAISE NOTICE 'Error in handle_new_user for user %: %, SQLSTATE: %',
      new.id, SQLERRM, SQLSTATE;
    -- Re-raise the error to ensure proper error handling
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();