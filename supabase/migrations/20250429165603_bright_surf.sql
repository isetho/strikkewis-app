/*
  # Fix role assignment and table insertion

  1. Changes
    - Simplify role assignment logic
    - Ensure proper table insertion
    - Add better error handling
    
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

-- Updated handle_new_user function with simplified role assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  role_name text;
  role_id uuid;
BEGIN
  -- Get role from metadata
  role_name := COALESCE(new.raw_user_meta_data->>'role', 'knitter');

  -- Insert into users table
  INSERT INTO public.users (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO UPDATE 
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name;

  -- Get role ID
  SELECT id INTO role_id 
  FROM public.roles 
  WHERE name = role_name;

  IF role_id IS NULL THEN
    RAISE EXCEPTION 'Role "%" not found', role_name;
  END IF;

  -- Insert user role
  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (new.id, role_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;

  -- Insert into role-specific table based on role
  CASE role_name
    WHEN 'designer' THEN
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
  END CASE;

  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create user: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;