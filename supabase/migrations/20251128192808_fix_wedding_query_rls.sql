/*
  # Fix Wedding Query RLS Issues

  ## Problem
  Queries filtering by user_id with .eq('user_id', user.id) cause 500 errors
  due to RLS policy evaluation order.

  ## Solution
  The existing policies are correct, but we need to ensure the query works properly.
  This migration verifies all policies are correctly set up and adds a function
  to help with debugging if needed.

  ## Changes
  1. Add a helper function to get user's wedding ID
  2. Ensure policies are correctly applied
*/

-- Drop existing policies if they exist to recreate them cleanly
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own weddings" ON weddings;
  DROP POLICY IF EXISTS "Users can create their own weddings" ON weddings;
  DROP POLICY IF EXISTS "Users can update their own weddings" ON weddings;
  DROP POLICY IF EXISTS "Users can delete their own weddings" ON weddings;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Recreate policies with explicit grants
CREATE POLICY "Users can view their own weddings"
  ON weddings FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM wedding_members
      WHERE wedding_members.wedding_id = weddings.id
      AND wedding_members.user_id = auth.uid()
    )
  );

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

-- Create a function to get the current user's wedding(s)
CREATE OR REPLACE FUNCTION get_user_weddings()
RETURNS SETOF weddings
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT *
  FROM weddings
  WHERE user_id = auth.uid()
     OR EXISTS (
       SELECT 1 FROM wedding_members
       WHERE wedding_members.wedding_id = weddings.id
       AND wedding_members.user_id = auth.uid()
     );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_weddings() TO authenticated;
