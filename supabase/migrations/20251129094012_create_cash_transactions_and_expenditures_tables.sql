/*
  # Create Cash Transactions and Expenditures Tables

  ## Overview
  This migration creates two new tables to track wedding financial activities:
  1. Cash transactions - All money received (pledges, gifts, other sources)
  2. Expenditures - All money spent on wedding expenses

  ## New Tables

  ### `cash_transactions`
  Tracks all incoming cash to the wedding fund:
  - `id` (uuid, primary key)
  - `wedding_id` (uuid, foreign key)
  - `transaction_date` (date) - When cash was received
  - `amount` (numeric) - Amount received
  - `source_type` (text) - 'pledge', 'gift', 'other'
  - `source_reference_id` (uuid, nullable) - Links to pledge ID if from pledge payment
  - `contributor_name` (text) - Who gave the money
  - `notes` (text, nullable) - Additional details
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `expenditures`
  Tracks all wedding expenses:
  - `id` (uuid, primary key)
  - `wedding_id` (uuid, foreign key)
  - `expense_date` (date) - When expense occurred
  - `category` (text) - Expense category
  - `description` (text) - What was purchased/paid for
  - `amount` (numeric) - Amount spent
  - `payment_method` (text) - How it was paid
  - `vendor_name` (text, nullable) - Who was paid
  - `notes` (text, nullable) - Additional details
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - RLS enabled on both tables
  - Simple policies without recursion
  - Users can only access their own wedding's data

  ## Important Notes
  - Cash transactions table will be the single source of truth for "Cash at Hand"
  - When a pledge payment is recorded, it creates a cash transaction
  - Expenditures are separate from budget items (budget = plan, expenditure = actual)
*/

-- Create cash_transactions table
CREATE TABLE IF NOT EXISTS cash_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric NOT NULL DEFAULT 0,
  source_type text NOT NULL DEFAULT 'other',
  source_reference_id uuid,
  contributor_name text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create expenditures table
CREATE TABLE IF NOT EXISTS expenditures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  payment_method text,
  vendor_name text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenditures ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies for cash_transactions (no recursion)
CREATE POLICY "Users can view own cash transactions"
  ON cash_transactions FOR SELECT
  TO authenticated
  USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own cash transactions"
  ON cash_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own cash transactions"
  ON cash_transactions FOR UPDATE
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

CREATE POLICY "Users can delete own cash transactions"
  ON cash_transactions FOR DELETE
  TO authenticated
  USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

-- Create simple RLS policies for expenditures (no recursion)
CREATE POLICY "Users can view own expenditures"
  ON expenditures FOR SELECT
  TO authenticated
  USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own expenditures"
  ON expenditures FOR INSERT
  TO authenticated
  WITH CHECK (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own expenditures"
  ON expenditures FOR UPDATE
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

CREATE POLICY "Users can delete own expenditures"
  ON expenditures FOR DELETE
  TO authenticated
  USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cash_transactions_wedding_id ON cash_transactions(wedding_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_date ON cash_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_source_reference ON cash_transactions(source_reference_id);
CREATE INDEX IF NOT EXISTS idx_expenditures_wedding_id ON expenditures(wedding_id);
CREATE INDEX IF NOT EXISTS idx_expenditures_date ON expenditures(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenditures_category ON expenditures(category);

-- Add constraint to ensure source_type is valid
ALTER TABLE cash_transactions 
  DROP CONSTRAINT IF EXISTS cash_transactions_source_type_check;

ALTER TABLE cash_transactions 
  ADD CONSTRAINT cash_transactions_source_type_check 
  CHECK (source_type IN ('pledge', 'gift', 'other'));
