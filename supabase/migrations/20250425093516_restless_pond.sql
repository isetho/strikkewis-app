/*
  # Create designer and knitter tables with role-based assignments

  1. New Tables
    - Ensure designers and knitters tables exist with proper structure
  
  2. Changes
    - Update handle_new_user function to insert into appropriate role table
    
  3. Security
    - Maintains existing security model
    - Ensures proper role assignments
*/

-- Ensure we have the designers table
CREATE TABLE IF NOT EXISTS public.designers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL,
    name text,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT designers_email_key UNIQUE (email)
);

-- Ensure we have the knitters table
CREATE TABLE IF NOT EXISTS public.knitters (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL,
    name text,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT knitters_email_key UNIQUE (email)
);

-- Updated handle_new_user function to handle designer/knitter assignments
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

  -- Insert into appropriate role-specific table
  IF role_name = 'designer' THEN
    INSERT INTO public.designers (id, email, name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
    ON CONFLICT (email) DO UPDATE 
      SET name = EXCLUDED.name;
  ELSE
    INSERT INTO public.knitters (id, email, name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
    ON CONFLICT (email) DO UPDATE 
      SET name = EXCLUDED.name;
  END IF;

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

    -- Insert into knitters table as fallback
    INSERT INTO public.knitters (id, email, name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
    ON CONFLICT (email) DO UPDATE 
      SET name = EXCLUDED.name;
    
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