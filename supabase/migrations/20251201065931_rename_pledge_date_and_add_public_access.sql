/*
  # Rename pledge_date to pledge_fulfillment_date and enable public pledge submission

  1. Changes
    - Rename `pledge_date` column to `pledge_fulfillment_date` in pledges table
    - Create `weddings_public` table to store public access tokens for external pledge submission
    - Add RLS policies for public pledge submission

  2. New Tables
    - `weddings_public`
      - `id` (uuid, primary key)
      - `wedding_id` (uuid, foreign key to weddings)
      - `access_token` (text, unique) - unique token for public access
      - `is_active` (boolean) - whether public submissions are enabled
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  3. Security
    - Enable RLS on `weddings_public` table
    - Allow public read access to active wedding tokens
    - Allow public insert to pledges table when using valid access token
    - Wedding owners can manage their public access settings
*/

-- Rename pledge_date to pledge_fulfillment_date
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pledges' AND column_name = 'pledge_date'
  ) THEN
    ALTER TABLE pledges RENAME COLUMN pledge_date TO pledge_fulfillment_date;
  END IF;
END $$;

-- Create weddings_public table for managing public access
CREATE TABLE IF NOT EXISTS weddings_public (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  access_token text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(wedding_id)
);

-- Enable RLS
ALTER TABLE weddings_public ENABLE ROW LEVEL SECURITY;

-- Policy: Wedding owners can view their public access settings
CREATE POLICY "Wedding owners can view their public access settings"
  ON weddings_public FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = weddings_public.wedding_id
      AND w.user_id = auth.uid()
    )
  );

-- Policy: Wedding owners can insert public access settings
CREATE POLICY "Wedding owners can insert public access settings"
  ON weddings_public FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = weddings_public.wedding_id
      AND w.user_id = auth.uid()
    )
  );

-- Policy: Wedding owners can update their public access settings
CREATE POLICY "Wedding owners can update their public access settings"
  ON weddings_public FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = weddings_public.wedding_id
      AND w.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = weddings_public.wedding_id
      AND w.user_id = auth.uid()
    )
  );

-- Policy: Anyone can view active public wedding access tokens
CREATE POLICY "Public can view active wedding tokens"
  ON weddings_public FOR SELECT
  TO anon
  USING (is_active = true);

-- Add new policy for public pledge submission
CREATE POLICY "Public can submit pledges with valid token"
  ON pledges FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings_public wp
      WHERE wp.wedding_id = pledges.wedding_id
      AND wp.is_active = true
    )
  );

-- Create updated_at trigger for weddings_public
CREATE OR REPLACE FUNCTION update_weddings_public_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_weddings_public_updated_at'
  ) THEN
    CREATE TRIGGER update_weddings_public_updated_at
      BEFORE UPDATE ON weddings_public
      FOR EACH ROW
      EXECUTE FUNCTION update_weddings_public_updated_at();
  END IF;
END $$;