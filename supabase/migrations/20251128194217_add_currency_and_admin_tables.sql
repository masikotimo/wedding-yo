/*
  # Add Currency Support and Admin Tables

  ## Changes
  1. Add currency field to weddings table (default: USD)
  2. Create admin_users table to track system administrators
  3. Add indexes for performance

  ## Tables Modified
  - `weddings` - Add currency column

  ## New Tables
  - `admin_users` - Track administrators who can monitor all weddings

  ## Security
  - Enable RLS on admin_users
  - Only admins can view admin_users table
  - Admins can view all weddings (special policy)
*/

-- Add currency column to weddings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weddings' AND column_name = 'currency'
  ) THEN
    ALTER TABLE weddings ADD COLUMN currency text DEFAULT 'USD';
  END IF;
END $$;

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email text NOT NULL,
  role text DEFAULT 'admin',
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true
);

-- Enable RLS on admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Admin users can view the admin_users table (to check if they're admin)
CREATE POLICY "Users can check if they are admin"
  ON admin_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Only existing admins can add new admins
CREATE POLICY "Admins can manage admin users"
  ON admin_users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Create policy for admins to view all weddings
CREATE POLICY "Admins can view all weddings"
  ON weddings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Create policy for admins to view all wedding members
CREATE POLICY "Admins can view all wedding members"
  ON wedding_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Create index for faster admin lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

-- Create a function to check if a user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  );
$$;

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- Note: To create the first admin, run this SQL manually with the user's ID:
-- INSERT INTO admin_users (user_id, email, role) 
-- VALUES ('your-user-id-here', 'admin@example.com', 'admin');
