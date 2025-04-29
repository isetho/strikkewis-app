/*
  # Add login attempts tracking

  1. New Tables
    - `login_attempts`: Track login attempts for rate limiting
      - `id` (uuid, primary key)
      - `email` (text)
      - `timestamp` (timestamptz)
      - `count` (integer)
  
  2. Security
    - Add RLS policies to protect login attempts data
    - Add function to clean up old attempts
*/

-- Create login attempts table
CREATE TABLE IF NOT EXISTS public.login_attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL,
    timestamp timestamptz NOT NULL DEFAULT now(),
    count integer NOT NULL DEFAULT 1
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