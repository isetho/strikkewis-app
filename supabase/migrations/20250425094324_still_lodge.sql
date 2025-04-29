/*
  # Update role assignment logic

  1. Changes
    - Simplify role assignment logic
    - Add proper error handling
    - Ensure users are added to correct role-specific tables
    
  2. Security
    - Maintains existing security model
    - Ensures data integrity through proper constraints
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

-- Updated handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  role_name text;
  role_id uuid;
BEGIN
  -- Get role from metadata
  role_name := COALESCE(NULLIF(TRIM(new.raw_user_meta_data->>'role'), ''), 'knitter');

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
    RAISE EXCEPTION 'Invalid role specified: %', role_name;
  END IF;

  -- Insert user role
  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (new.id, role_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;

  -- Insert into role-specific table based on selection
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
    RAISE EXCEPTION 'Failed to create user: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;