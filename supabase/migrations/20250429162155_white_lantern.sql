/*
  # Add account lockout functionality

  1. New Tables
    - Add locked_until column to users table
    - Add functions for account locking
  
  2. Security
    - Add account lockout after too many failed attempts
    - Add functions to check and manage account locks
*/

-- Add locked_until column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS locked_until timestamptz;

-- Function to lock account
CREATE OR REPLACE FUNCTION lock_account(
    user_email text,
    lock_duration interval DEFAULT interval '30 minutes'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.users
    SET locked_until = now() + lock_duration
    WHERE email = user_email;
END;
$$;

-- Function to check if account is locked
CREATE OR REPLACE FUNCTION is_account_locked(
    user_email text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    lock_time timestamptz;
BEGIN
    SELECT locked_until INTO lock_time
    FROM public.users
    WHERE email = user_email;

    RETURN lock_time IS NOT NULL AND lock_time > now();
END;
$$;

-- Update track_failed_login to include account locking
CREATE OR REPLACE FUNCTION track_failed_login(
    user_email text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    ts timestamptz;
    total_attempts integer;
BEGIN
    ts := date_trunc('hour', now());
    
    INSERT INTO public.login_attempts (email, timestamp, count)
    VALUES (user_email, ts, 1)
    ON CONFLICT (email, timestamp)
    DO UPDATE SET count = login_attempts.count + 1
    RETURNING count INTO total_attempts;

    -- Lock account after 10 failed attempts
    IF total_attempts >= 10 THEN
        PERFORM lock_account(user_email);
    END IF;
END;
$$;