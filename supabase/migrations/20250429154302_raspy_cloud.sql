/*
  # Add failed login tracking and cleanup

  1. Changes
    - Add function to track failed login attempts
    - Add function to check login attempt limits
    - Add scheduled cleanup trigger
    
  2. Security
    - Ensure proper rate limiting
    - Clean up old login attempts automatically
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
  ON CONFLICT (email) WHERE timestamp > now() - interval '15 minutes'
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
  AND timestamp > now() - interval '15 minutes'
  ORDER BY timestamp DESC
  LIMIT 1;

  RETURN COALESCE(attempt_count, 0) >= 5;
END;
$$;

-- Create a scheduled job to clean up old attempts
SELECT cron.schedule(
  'cleanup-login-attempts',
  '0 * * * *', -- Run every hour
  $$
  SELECT clean_old_login_attempts();
  $$
);