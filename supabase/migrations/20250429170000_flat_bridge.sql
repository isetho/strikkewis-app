/*
  # Fix user role assignment and table insertion

  1. Changes
    - Ensure proper table structure for designers and knitters
    - Update handle_new_user function to correctly handle role assignment
    - Add proper error handling and logging
    
  2. Security
    - Maintain existing security model
    - Ensure proper role assignment
*/

-- Ensure we have the designers table
CREATE TABLE IF NOT EXISTS public.designers (
    id uuid PRIMARY KEY,
    email text NOT NULL,
    name text,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT designers_email_key UNIQUE (email)
);

-- Ensure we have the knitters table
CREATE TABLE IF NOT EXISTS public.knitters (
    id uuid PRIMARY KEY,
    email text NOT NULL,
    name text,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT knitters_email_key UNIQUE (email)
);

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

-- Updated handle_new_user function with improved role handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  role_name text;
  role_id uuid;
BEGIN
  -- Get role from metadata with proper validation
  role_name := NULLIF(TRIM(new.raw_user_meta_data->>'role'), '');
  IF role_name IS NULL OR role_name NOT IN ('designer', 'knitter') THEN
    role_name := 'knitter';
  END IF;

  -- Insert into users table
  INSERT INTO public.users (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO UPDATE 
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name;

  -- Get role ID
  SELECT id INTO STRICT role_id 
  FROM public.roles 
  WHERE name = role_name;

  -- Insert user role
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
    RAISE LOG 'Error in handle_new_user: %, Detail: %, Hint: %', 
      SQLERRM, SQLSTATE, SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;