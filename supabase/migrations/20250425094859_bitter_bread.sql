/*
  # Fix user creation trigger function

  1. Changes
    - Ensure proper table structure
    - Improve error handling in trigger function
    - Add proper constraints
    - Fix role assignment logic
    
  2. Security
    - Maintain existing security model
    - Ensure proper role assignment
*/

-- First ensure proper table structure
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY,
    email text NOT NULL,
    full_name text,
    CONSTRAINT users_email_key UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS public.roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    CONSTRAINT roles_name_key UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id)
        REFERENCES public.roles(id) ON DELETE CASCADE
);

-- Ensure required roles exist
INSERT INTO public.roles (name)
VALUES 
    ('designer'),
    ('knitter')
ON CONFLICT (name) DO NOTHING;

-- Improved handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
<<fn>>
DECLARE
    role_name text;
    role_id uuid;
BEGIN
    -- Start a subtransaction for better error handling
    BEGIN
        -- Insert into users table first
        INSERT INTO public.users (id, email, full_name)
        VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');

        -- Get role from metadata with proper default handling
        role_name := COALESCE(NULLIF(TRIM(new.raw_user_meta_data->>'role'), ''), 'knitter');
        
        -- Get role ID
        SELECT id INTO STRICT role_id 
        FROM public.roles 
        WHERE name = role_name;

        -- Assign role to user
        INSERT INTO public.user_roles (user_id, role_id)
        VALUES (new.id, role_id);

        RETURN new;
    EXCEPTION 
        WHEN unique_violation THEN
            -- If user already exists, just return
            RETURN new;
        WHEN NO_DATA_FOUND THEN
            -- If role not found, default to knitter
            SELECT id INTO STRICT role_id 
            FROM public.roles 
            WHERE name = 'knitter';
            
            INSERT INTO public.user_roles (user_id, role_id)
            VALUES (new.id, role_id);
            
            RETURN new;
        WHEN OTHERS THEN
            RAISE EXCEPTION 'Failed to create user: %', SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();