/*
  # Fix Admin Policies Infinite Recursion

  ## Problem
  The weddings table has a policy that checks admin_users table, which creates
  a circular dependency causing infinite recursion.

  ## Solution
  1. Simplify admin_users policies - remove complex checks
  2. Update weddings policies to avoid recursion
  3. Use SECURITY DEFINER functions where needed

  ## Changes
  1. Drop and recreate admin_users policies (simpler)
  2. Drop and recreate the admin policy on weddings table
*/

-- Drop existing admin policy on weddings that causes recursion
DROP POLICY IF EXISTS "Admins can view all weddings" ON weddings;

-- Drop existing policies on admin_users
DROP POLICY IF EXISTS "Users can check if they are admin" ON admin_users;
DROP POLICY IF EXISTS "Admins can manage admin users" ON admin_users;

-- Create simpler policies for admin_users (no recursion)
-- Users can only see their own admin record
CREATE POLICY "Users can view own admin status"
  ON admin_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Only existing admins can insert new admins
-- This uses a direct subquery without recursion
CREATE POLICY "Admins can insert admin users"
  ON admin_users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Only existing admins can update admin users
CREATE POLICY "Admins can update admin users"
  ON admin_users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Only existing admins can delete admin users
CREATE POLICY "Admins can delete admin users"
  ON admin_users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Update is_admin function to be more efficient
DROP FUNCTION IF EXISTS is_admin();

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

-- Recreate admin weddings viewing policy using the function
-- This prevents recursion by using SECURITY DEFINER function
CREATE POLICY "Admins can view all weddings"
  ON weddings FOR SELECT
  TO authenticated
  USING (is_admin());

-- Recreate admin wedding_members viewing policy
DROP POLICY IF EXISTS "Admins can view all wedding members" ON wedding_members;

CREATE POLICY "Admins can view all wedding members"
  ON wedding_members FOR SELECT
  TO authenticated
  USING (is_admin());
