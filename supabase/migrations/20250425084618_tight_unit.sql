/*
  # Create roles and triggers for user registration

  1. New Tables
    - Ensure roles table exists
    - Add initial roles (designer and knitter)
  
  2. Changes
    - Add initial roles
    - Update handle_new_user function to handle role assignment
*/

-- Create roles if they don't exist
INSERT INTO public.roles (id, name)
VALUES 
  (gen_random_uuid(), 'designer'),
  (gen_random_uuid(), 'knitter')
ON CONFLICT (id) DO NOTHING;

-- Update handle_new_user function to handle role selection
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  role_name text;
BEGIN
  -- Insert into users table
  INSERT INTO public.users (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');

  -- Get role from metadata
  role_name := new.raw_user_meta_data->>'role';
  
  -- If no role specified, default to 'knitter'
  IF role_name IS NULL OR role_name = '' THEN
    role_name := 'knitter';
  END IF;

  -- Insert user role
  INSERT INTO public.user_roles (user_id, role_id)
  SELECT new.id, id FROM public.roles WHERE name = role_name;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;