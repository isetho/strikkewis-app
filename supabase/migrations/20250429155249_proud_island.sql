/*
  # Fix rate limiting implementation

  1. Changes
    - Add composite primary key to login_attempts table
    - Update track_failed_login function to handle conflicts correctly
    - Update is_rate_limited function to count attempts properly
    - Add automatic cleanup through a trigger
    
  2. Security
    - Maintains existing RLS policies
    - Ensures proper rate limiting
*/

-- Drop existing table and recreate with composite primary key
DROP TABLE IF EXISTS public.login_attempts;

CREATE TABLE public.login_attempts (
    id uuid DEFAULT gen_random_uuid(),
    email text NOT NULL,
    timestamp timestamptz NOT NULL DEFAULT now(),
    count integer NOT NULL DEFAULT 1,
    PRIMARY KEY (email, timestamp)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS login_attempts_email_timestamp_idx 
ON public.login_attempts (email, timestamp);

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserting attempts
CREATE POLICY "Allow inserting login attempts"
ON public.login_attempts
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Create policy to allow reading own attempts
CREATE POLICY "Allow reading own attempts"
ON public.login_attempts
FOR SELECT
TO authenticated
USING (email = auth.email());

-- Function to track failed login attempts
CREATE OR REPLACE FUNCTION track_failed_login(
  user_email text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_timestamp timestamptz;
BEGIN
  current_timestamp := date_trunc('hour', now());
  
  INSERT INTO public.login_attempts (email, timestamp, count)
  VALUES (user_email, current_timestamp, 1)
  ON CONFLICT (email, timestamp)
  DO UPDATE SET count = login_attempts.count + 1;
END;
$$;

-- Function to check if user is rate limited
CREATE OR REPLACE FUNCTION is_rate_limited(
  user_email text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_attempts integer;
BEGIN
  SELECT COALESCE(SUM(count), 0) INTO total_attempts
  FROM login_attempts
  WHERE email = user_email
  AND timestamp > now() - interval '15 minutes';

  RETURN total_attempts >= 5;
END;
$$;

-- Function to clean up old attempts
CREATE OR REPLACE FUNCTION clean_old_login_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.login_attempts
  WHERE timestamp < now() - interval '1 hour';
END;
$$;

-- Create trigger to automatically clean up old attempts
CREATE OR REPLACE FUNCTION clean_old_attempts_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Clean up old attempts when inserting new ones
  DELETE FROM public.login_attempts
  WHERE timestamp < now() - interval '1 hour';
  RETURN NEW;
END;
$$;

CREATE TRIGGER cleanup_old_attempts
  AFTER INSERT ON public.login_attempts
  FOR EACH STATEMENT
  EXECUTE FUNCTION clean_old_attempts_trigger();