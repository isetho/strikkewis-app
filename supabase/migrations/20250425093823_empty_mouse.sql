/*
  # Fix user role assignment

  1. Changes
    - Simplify handle_new_user function
    - Add better error handling
    - Ensure proper role assignment
    - Fix designer/knitter table assignments
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

-- Simplified and fixed handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  role_name text;
  role_id uuid;
BEGIN
  -- Get role from metadata, defaulting to knitter if not specified
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
    -- If role not found, default to knitter
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

  -- Insert into appropriate role-specific table
  IF role_name = 'designer' THEN
    INSERT INTO public.designers (id, email, name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.knitters (id, email, name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;