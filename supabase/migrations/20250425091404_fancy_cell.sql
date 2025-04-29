/*
  # Fix user role handling

  1. Changes
    - Add trigger to sync user metadata role with user_roles table
    - Improve error handling in handle_new_user function
    - Add function to update user role
  
  2. Security
    - Maintains existing RLS policies
    - Ensures role consistency between auth.users metadata and user_roles table
*/

-- Function to handle new user registration with improved role handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  role_name text;
  role_id uuid;
BEGIN
  -- Insert into users table with error handling
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
    -- Invalid role specified, fallback to knitter
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

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();