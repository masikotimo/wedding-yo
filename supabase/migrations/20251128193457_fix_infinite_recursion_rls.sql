/*
  # Fix Infinite Recursion in RLS Policies

  ## Problem
  The weddings table policy checks wedding_members, and wedding_members policy
  checks weddings, creating an infinite recursion loop.

  ## Solution
  Simplify the policies to break the circular dependency:
  1. Weddings policy: Only check direct ownership (auth.uid() = user_id)
  2. Wedding_members policy: Use a simpler check that doesn't recurse

  ## Changes
  1. Drop and recreate weddings policies without wedding_members check
  2. Simplify wedding_members policies to avoid recursion
*/

-- Drop existing policies on weddings
DROP POLICY IF EXISTS "Users can view their own weddings" ON weddings;
DROP POLICY IF EXISTS "Users can create their own weddings" ON weddings;
DROP POLICY IF EXISTS "Users can update their own weddings" ON weddings;
DROP POLICY IF EXISTS "Users can delete their own weddings" ON weddings;

-- Drop existing policies on wedding_members
DROP POLICY IF EXISTS "Wedding members can view team" ON wedding_members;
DROP POLICY IF EXISTS "Wedding owners can manage members" ON wedding_members;
DROP POLICY IF EXISTS "Wedding owners can update members" ON wedding_members;
DROP POLICY IF EXISTS "Wedding owners can delete members" ON wedding_members;

-- Recreate weddings policies (simpler, no recursion)
CREATE POLICY "Users can view their own weddings"
  ON weddings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own weddings"
  ON weddings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weddings"
  ON weddings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weddings"
  ON weddings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Recreate wedding_members policies (simpler, no recursion back to weddings)
CREATE POLICY "Wedding members can view team"
  ON wedding_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Wedding owners can manage members"
  ON wedding_members FOR INSERT
  TO authenticated
  WITH CHECK (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Wedding owners can update members"
  ON wedding_members FOR UPDATE
  TO authenticated
  USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Wedding owners can delete members"
  ON wedding_members FOR DELETE
  TO authenticated
  USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );
