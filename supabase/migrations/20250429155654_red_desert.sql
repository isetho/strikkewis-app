/*
  # Fix login attempts tracking and rate limiting

  1. Tables
    - login_attempts: Tracks failed login attempts with timestamp-based cleanup
      - id (uuid, primary key)
      - email (text)
      - timestamp (timestamptz)
      - count (integer)

  2. Functions
    - track_failed_login: Records failed login attempts
    - is_rate_limited: Checks if a user has exceeded login attempts
    - clean_old_attempts_trigger: Automatically cleans up old attempts

  3. Security
    - Enable RLS on login_attempts table
    - Add policies for inserting and reading attempts
*/

-- Drop existing table and recreate with proper structure
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
    ts timestamptz;
BEGIN
    ts := date_trunc('hour', now());
    
    INSERT INTO public.login_attempts (email, timestamp, count)
    VALUES (user_email, ts, 1)
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

-- Function to clean up old attempts via trigger
CREATE OR REPLACE FUNCTION clean_old_attempts_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM clean_old_login_attempts();
    RETURN NEW;
END;
$$;

-- Create trigger to automatically clean up old attempts
CREATE TRIGGER cleanup_old_attempts
    AFTER INSERT ON public.login_attempts
    FOR EACH STATEMENT
    EXECUTE FUNCTION clean_old_attempts_trigger();