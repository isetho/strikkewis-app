/*
  # Improve user authentication trigger

  1. Changes
    - Update handle_new_user function with better error handling
    - Ensure proper role assignment for new users
    
  2. Security
    - Add proper error handling for role assignment
    - Ensure default role fallback
*/

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

  -- Get role from metadata with proper error handling
  BEGIN
    -- Default to 'knitter' if no role specified
    role_name := COALESCE(new.raw_user_meta_data->>'role', 'knitter');
    
    -- Get role ID, defaulting to knitter if specified role doesn't exist
    SELECT id INTO role_id 
    FROM public.roles 
    WHERE name = role_name;

    IF role_id IS NULL THEN
      -- Fallback to knitter role
      SELECT id INTO role_id 
      FROM public.roles 
      WHERE name = 'knitter';
      
      IF role_id IS NULL THEN
        RAISE EXCEPTION 'Required role "knitter" not found';
      END IF;
    END IF;

    -- Insert user role with error handling
    BEGIN
      INSERT INTO public.user_roles (user_id, role_id)
      VALUES (new.id, role_id);
    EXCEPTION 
      WHEN unique_violation THEN
        -- Skip if role assignment already exists
        NULL;
    END;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error and continue
      RAISE WARNING 'Error assigning role to user %: %', new.id, SQLERRM;
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;