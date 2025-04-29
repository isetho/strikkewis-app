/*
  # Add rate limiting functions for login attempts

  1. Changes
    - Add function to track failed login attempts
    - Add function to check if user is rate limited
    
  2. Security
    - Functions run with SECURITY DEFINER to ensure proper access control
    - Maintains existing RLS policies
*/

-- Function to track failed login attempts
CREATE OR REPLACE FUNCTION track_failed_login(
  user_email text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.login_attempts (email, count)
  VALUES (user_email, 1)
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
  attempt_count integer;
BEGIN
  SELECT count INTO attempt_count
  FROM login_attempts
  WHERE email = user_email
  AND timestamp > now() - interval '15 minutes';

  RETURN COALESCE(attempt_count, 0) >= 5;
END;
$$;