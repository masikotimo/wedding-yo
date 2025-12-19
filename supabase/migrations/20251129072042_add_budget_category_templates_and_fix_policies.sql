/*
  # Add Budget Category Templates and Fix RLS Policies

  ## Changes
  1. Create budget_category_templates table for default wedding budget categories
  2. Update budget_sections policies to avoid recursion
  3. Add ability to customize categories per wedding
  4. Insert default category templates

  ## New Tables
  - `budget_category_templates` - Default category templates that users can choose from

  ## Modified Tables
  - `budget_sections` - Add is_custom field to track custom categories

  ## Security
  - Simple RLS policies without recursion
  - Users can only manage their own wedding's budget sections
*/

-- Create budget category templates table (no RLS needed - read-only for all users)
CREATE TABLE IF NOT EXISTS budget_category_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Add is_custom field to budget_sections if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budget_sections' AND column_name = 'is_custom'
  ) THEN
    ALTER TABLE budget_sections ADD COLUMN is_custom boolean DEFAULT false;
  END IF;
END $$;

-- Drop existing policies on budget_sections to recreate them
DROP POLICY IF EXISTS "Users can view own budget sections" ON budget_sections;
DROP POLICY IF EXISTS "Users can insert own budget sections" ON budget_sections;
DROP POLICY IF EXISTS "Users can update own budget sections" ON budget_sections;
DROP POLICY IF EXISTS "Users can delete own budget sections" ON budget_sections;

-- Create simple policies for budget_sections (no recursion)
CREATE POLICY "Users can view own budget sections"
  ON budget_sections FOR SELECT
  TO authenticated
  USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own budget sections"
  ON budget_sections FOR INSERT
  TO authenticated
  WITH CHECK (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own budget sections"
  ON budget_sections FOR UPDATE
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

CREATE POLICY "Users can delete own budget sections"
  ON budget_sections FOR DELETE
  TO authenticated
  USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

-- Allow all authenticated users to view templates (no RLS needed for read-only data)
ALTER TABLE budget_category_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view category templates"
  ON budget_category_templates FOR SELECT
  TO authenticated
  USING (true);

-- Insert default category templates
INSERT INTO budget_category_templates (name, description, display_order) VALUES
  ('Church & Ceremony', 'Church fees, pastor, choir, and ceremony essentials', 1),
  ('Groom & Bridal Items', 'Wedding attire, rings, accessories', 2),
  ('Decorations & Venue', 'Venue hire, flowers, decorations, setup', 3),
  ('Food & Drinks', 'Catering, beverages, cake', 4),
  ('Entertainment', 'DJ, band, MC, performers', 5),
  ('Media & Transport', 'Photography, videography, transport', 6),
  ('Invitations & Stationery', 'Invitations, programs, thank you cards', 7),
  ('Launch Event', 'Pre-wedding events and activities', 8),
  ('Miscellaneous', 'Other expenses and contingencies', 9)
ON CONFLICT DO NOTHING;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_budget_sections_wedding_id ON budget_sections(wedding_id);
CREATE INDEX IF NOT EXISTS idx_budget_category_templates_display_order ON budget_category_templates(display_order);
