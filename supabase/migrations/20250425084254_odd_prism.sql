/*
  # Create auth trigger for new users

  1. New Tables
    - None (uses existing tables)
  
  2. Changes
    - Add trigger to automatically create user record and role assignment
    
  3. Security
    - Ensures every authenticated user gets proper role assignment
*/

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into users table
  INSERT INTO public.users (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');

  -- Get the role ID for 'knitter' (default role)
  INSERT INTO public.user_roles (user_id, role_id)
  SELECT new.id, id FROM public.roles WHERE name = 'knitter';

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();