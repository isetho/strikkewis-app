/*
  # Create roles table and insert default roles

  1. New Tables
    - `roles` table with:
      - `id` (uuid, primary key)
      - `name` (text, unique)

  2. Security
    - Enable RLS on roles table
    - Add policy for authenticated users to read roles

  3. Data
    - Insert default designer and knitter roles
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL
);

-- Create unique index on name
CREATE UNIQUE INDEX IF NOT EXISTS roles_name_idx ON roles (name);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read roles"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

-- Insert default roles
INSERT INTO roles (id, name)
SELECT uuid_generate_v4(), name
FROM (VALUES ('designer'), ('knitter')) AS default_roles(name)
WHERE NOT EXISTS (
  SELECT 1 FROM roles WHERE name = default_roles.name
);