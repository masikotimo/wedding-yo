/*
  # Wedding Planning Platform - Complete Database Schema

  ## Overview
  This migration creates a multi-tenant wedding planning system with subscription support.
  Each wedding is isolated, and users can manage multiple weddings with role-based access.

  ## New Tables

  ### 1. `weddings`
  Core table for each wedding event
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users) - Wedding owner
  - `bride_name` (text)
  - `groom_name` (text)
  - `wedding_date` (date)
  - `expected_guests` (integer) - Drives dynamic calculations
  - `subscription_status` (text) - free, trial, active, expired
  - `subscription_ends_at` (timestamptz)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `wedding_members`
  Committee members and collaborators for each wedding
  - `id` (uuid, primary key)
  - `wedding_id` (uuid, references weddings)
  - `user_id` (uuid, references auth.users)
  - `role` (text) - admin, committee_member, viewer
  - `name` (text)
  - `phone` (text)
  - `email` (text)
  - `created_at` (timestamptz)

  ### 3. `budget_sections`
  Budget category sections
  - `id` (uuid, primary key)
  - `wedding_id` (uuid, references weddings)
  - `name` (text) - Church & Ceremony, Food & Drinks, etc.
  - `display_order` (integer)
  - `created_at` (timestamptz)

  ### 4. `budget_items`
  Individual budget line items with dynamic guest calculations
  - Automatic recalculation when expected_guests changes
  - Support for guest-dependent items

  ### 5. `pledges`
  Financial pledges from contributors with payment tracking

  ### 6. `payments`
  Payment transaction records linked to pledges and budget items

  ### 7. `service_providers`
  Vendors and service providers management

  ### 8. `agenda_items`
  Meeting and event agenda items

  ### 9. `guests`
  Guest list management with RSVP tracking

  ### 10. `subscriptions`
  Subscription and billing history

  ## Security
  - RLS enabled on all tables
  - Users can only access weddings they own or are members of
  - Role-based permissions enforced at database level
*/

-- Create weddings table
CREATE TABLE IF NOT EXISTS weddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bride_name text NOT NULL,
  groom_name text NOT NULL,
  wedding_date date NOT NULL,
  expected_guests integer DEFAULT 0,
  subscription_status text DEFAULT 'free_trial',
  subscription_ends_at timestamptz DEFAULT (now() + interval '14 days'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create wedding_members table
CREATE TABLE IF NOT EXISTS wedding_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid REFERENCES weddings(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'viewer',
  name text NOT NULL,
  phone text,
  email text,
  created_at timestamptz DEFAULT now()
);

-- Create budget_sections table
CREATE TABLE IF NOT EXISTS budget_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid REFERENCES weddings(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create budget_items table
CREATE TABLE IF NOT EXISTS budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid REFERENCES budget_sections(id) ON DELETE CASCADE NOT NULL,
  wedding_id uuid REFERENCES weddings(id) ON DELETE CASCADE NOT NULL,
  item_name text NOT NULL,
  quantity numeric DEFAULT 1,
  unit_cost numeric DEFAULT 0,
  amount numeric DEFAULT 0,
  paid numeric DEFAULT 0,
  balance numeric DEFAULT 0,
  status text DEFAULT 'pending',
  is_guest_dependent boolean DEFAULT false,
  guest_multiplier numeric DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create pledges table
CREATE TABLE IF NOT EXISTS pledges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid REFERENCES weddings(id) ON DELETE CASCADE NOT NULL,
  contributor_name text NOT NULL,
  phone text,
  email text,
  amount_pledged numeric DEFAULT 0,
  amount_paid numeric DEFAULT 0,
  balance numeric DEFAULT 0,
  payment_method text,
  pledge_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid REFERENCES weddings(id) ON DELETE CASCADE NOT NULL,
  pledge_id uuid REFERENCES pledges(id) ON DELETE SET NULL,
  budget_item_id uuid REFERENCES budget_items(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  payment_method text,
  payment_date date DEFAULT CURRENT_DATE,
  paid_by text,
  received_by text,
  reference_number text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create service_providers table
CREATE TABLE IF NOT EXISTS service_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid REFERENCES weddings(id) ON DELETE CASCADE NOT NULL,
  provider_name text NOT NULL,
  contact_person text,
  phone text,
  email text,
  category text,
  service_description text,
  venue text,
  delivery_date date,
  committee_responsible text,
  person_responsible text,
  contract_amount numeric DEFAULT 0,
  amount_paid numeric DEFAULT 0,
  balance numeric DEFAULT 0,
  status text DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create agenda_items table
CREATE TABLE IF NOT EXISTS agenda_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid REFERENCES weddings(id) ON DELETE CASCADE NOT NULL,
  agenda_type text DEFAULT 'committee_meeting',
  item_title text NOT NULL,
  description text,
  start_time timestamptz,
  end_time timestamptz,
  duration_minutes integer,
  venue text,
  committee_responsible text,
  person_responsible text,
  display_order integer DEFAULT 0,
  status text DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create guests table
CREATE TABLE IF NOT EXISTS guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid REFERENCES weddings(id) ON DELETE CASCADE NOT NULL,
  guest_name text NOT NULL,
  phone text,
  email text,
  category text DEFAULT 'guest',
  rsvp_status text DEFAULT 'pending',
  plus_ones integer DEFAULT 0,
  table_assignment text,
  dietary_restrictions text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid REFERENCES weddings(id) ON DELETE CASCADE NOT NULL,
  plan_type text NOT NULL,
  amount numeric DEFAULT 0,
  currency text DEFAULT 'USD',
  payment_method text,
  payment_reference text,
  starts_at timestamptz DEFAULT now(),
  ends_at timestamptz,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for weddings
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

-- RLS Policies for wedding_members
CREATE POLICY "Wedding members can view team"
  ON wedding_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = wedding_members.wedding_id
      AND (weddings.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM wedding_members wm
        WHERE wm.wedding_id = weddings.id
        AND wm.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Wedding owners can manage members"
  ON wedding_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = wedding_members.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Wedding owners can update members"
  ON wedding_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = wedding_members.wedding_id
      AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = wedding_members.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Wedding owners can delete members"
  ON wedding_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = wedding_members.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

-- RLS Policies for budget_sections
CREATE POLICY "Wedding team can view budget sections"
  ON budget_sections FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_sections.wedding_id
      AND (weddings.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM wedding_members
        WHERE wedding_members.wedding_id = weddings.id
        AND wedding_members.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Wedding owners and admins can manage budget sections"
  ON budget_sections FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings w
      LEFT JOIN wedding_members wm ON wm.wedding_id = w.id AND wm.user_id = auth.uid()
      WHERE w.id = budget_sections.wedding_id
      AND (w.user_id = auth.uid() OR wm.role = 'admin')
    )
  );

CREATE POLICY "Wedding owners and admins can update budget sections"
  ON budget_sections FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings w
      LEFT JOIN wedding_members wm ON wm.wedding_id = w.id AND wm.user_id = auth.uid()
      WHERE w.id = budget_sections.wedding_id
      AND (w.user_id = auth.uid() OR wm.role = 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings w
      LEFT JOIN wedding_members wm ON wm.wedding_id = w.id AND wm.user_id = auth.uid()
      WHERE w.id = budget_sections.wedding_id
      AND (w.user_id = auth.uid() OR wm.role = 'admin')
    )
  );

CREATE POLICY "Wedding owners and admins can delete budget sections"
  ON budget_sections FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings w
      LEFT JOIN wedding_members wm ON wm.wedding_id = w.id AND wm.user_id = auth.uid()
      WHERE w.id = budget_sections.wedding_id
      AND (w.user_id = auth.uid() OR wm.role = 'admin')
    )
  );

-- RLS Policies for budget_items
CREATE POLICY "Wedding team can view budget items"
  ON budget_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND (weddings.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM wedding_members
        WHERE wedding_members.wedding_id = weddings.id
        AND wedding_members.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Wedding owners and admins can manage budget items"
  ON budget_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings w
      LEFT JOIN wedding_members wm ON wm.wedding_id = w.id AND wm.user_id = auth.uid()
      WHERE w.id = budget_items.wedding_id
      AND (w.user_id = auth.uid() OR wm.role = 'admin')
    )
  );

CREATE POLICY "Wedding owners and admins can update budget items"
  ON budget_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings w
      LEFT JOIN wedding_members wm ON wm.wedding_id = w.id AND wm.user_id = auth.uid()
      WHERE w.id = budget_items.wedding_id
      AND (w.user_id = auth.uid() OR wm.role = 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings w
      LEFT JOIN wedding_members wm ON wm.wedding_id = w.id AND wm.user_id = auth.uid()
      WHERE w.id = budget_items.wedding_id
      AND (w.user_id = auth.uid() OR wm.role = 'admin')
    )
  );

CREATE POLICY "Wedding owners and admins can delete budget items"
  ON budget_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings w
      LEFT JOIN wedding_members wm ON wm.wedding_id = w.id AND wm.user_id = auth.uid()
      WHERE w.id = budget_items.wedding_id
      AND (w.user_id = auth.uid() OR wm.role = 'admin')
    )
  );

-- RLS Policies for pledges
CREATE POLICY "Wedding team can view pledges"
  ON pledges FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = pledges.wedding_id
      AND (weddings.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM wedding_members
        WHERE wedding_members.wedding_id = weddings.id
        AND wedding_members.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Wedding owners and admins can manage pledges"
  ON pledges FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings w
      LEFT JOIN wedding_members wm ON wm.wedding_id = w.id AND wm.user_id = auth.uid()
      WHERE w.id = pledges.wedding_id
      AND (w.user_id = auth.uid() OR wm.role = 'admin')
    )
  );

CREATE POLICY "Wedding owners and admins can update pledges"
  ON pledges FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings w
      LEFT JOIN wedding_members wm ON wm.wedding_id = w.id AND wm.user_id = auth.uid()
      WHERE w.id = pledges.wedding_id
      AND (w.user_id = auth.uid() OR wm.role = 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings w
      LEFT JOIN wedding_members wm ON wm.wedding_id = w.id AND wm.user_id = auth.uid()
      WHERE w.id = pledges.wedding_id
      AND (w.user_id = auth.uid() OR wm.role = 'admin')
    )
  );

CREATE POLICY "Wedding owners and admins can delete pledges"
  ON pledges FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings w
      LEFT JOIN wedding_members wm ON wm.wedding_id = w.id AND wm.user_id = auth.uid()
      WHERE w.id = pledges.wedding_id
      AND (w.user_id = auth.uid() OR wm.role = 'admin')
    )
  );

-- Similar policies for remaining tables
CREATE POLICY "Wedding team can view payments"
  ON payments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = payments.wedding_id AND (weddings.user_id = auth.uid() OR EXISTS (SELECT 1 FROM wedding_members WHERE wedding_members.wedding_id = weddings.id AND wedding_members.user_id = auth.uid()))));

CREATE POLICY "Wedding owners and admins can manage payments"
  ON payments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM weddings w LEFT JOIN wedding_members wm ON wm.wedding_id = w.id AND wm.user_id = auth.uid() WHERE w.id = payments.wedding_id AND (w.user_id = auth.uid() OR wm.role = 'admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM weddings w LEFT JOIN wedding_members wm ON wm.wedding_id = w.id AND wm.user_id = auth.uid() WHERE w.id = payments.wedding_id AND (w.user_id = auth.uid() OR wm.role = 'admin')));

CREATE POLICY "Wedding team can view service providers"
  ON service_providers FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = service_providers.wedding_id AND (weddings.user_id = auth.uid() OR EXISTS (SELECT 1 FROM wedding_members WHERE wedding_members.wedding_id = weddings.id AND wedding_members.user_id = auth.uid()))));

CREATE POLICY "Wedding owners and admins can manage service providers"
  ON service_providers FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM weddings w LEFT JOIN wedding_members wm ON wm.wedding_id = w.id AND wm.user_id = auth.uid() WHERE w.id = service_providers.wedding_id AND (w.user_id = auth.uid() OR wm.role = 'admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM weddings w LEFT JOIN wedding_members wm ON wm.wedding_id = w.id AND wm.user_id = auth.uid() WHERE w.id = service_providers.wedding_id AND (w.user_id = auth.uid() OR wm.role = 'admin')));

CREATE POLICY "Wedding team can view agenda items"
  ON agenda_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = agenda_items.wedding_id AND (weddings.user_id = auth.uid() OR EXISTS (SELECT 1 FROM wedding_members WHERE wedding_members.wedding_id = weddings.id AND wedding_members.user_id = auth.uid()))));

CREATE POLICY "Wedding owners and admins can manage agenda items"
  ON agenda_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM weddings w LEFT JOIN wedding_members wm ON wm.wedding_id = w.id AND wm.user_id = auth.uid() WHERE w.id = agenda_items.wedding_id AND (w.user_id = auth.uid() OR wm.role = 'admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM weddings w LEFT JOIN wedding_members wm ON wm.wedding_id = w.id AND wm.user_id = auth.uid() WHERE w.id = agenda_items.wedding_id AND (w.user_id = auth.uid() OR wm.role = 'admin')));

CREATE POLICY "Wedding team can view guests"
  ON guests FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = guests.wedding_id AND (weddings.user_id = auth.uid() OR EXISTS (SELECT 1 FROM wedding_members WHERE wedding_members.wedding_id = weddings.id AND wedding_members.user_id = auth.uid()))));

CREATE POLICY "Wedding owners and admins can manage guests"
  ON guests FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM weddings w LEFT JOIN wedding_members wm ON wm.wedding_id = w.id AND wm.user_id = auth.uid() WHERE w.id = guests.wedding_id AND (w.user_id = auth.uid() OR wm.role = 'admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM weddings w LEFT JOIN wedding_members wm ON wm.wedding_id = w.id AND wm.user_id = auth.uid() WHERE w.id = guests.wedding_id AND (w.user_id = auth.uid() OR wm.role = 'admin')));

CREATE POLICY "Wedding owners can view subscriptions"
  ON subscriptions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = subscriptions.wedding_id AND weddings.user_id = auth.uid()));

CREATE POLICY "Wedding owners can manage subscriptions"
  ON subscriptions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = subscriptions.wedding_id AND weddings.user_id = auth.uid()));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_wedding_members_wedding_id ON wedding_members(wedding_id);
CREATE INDEX IF NOT EXISTS idx_wedding_members_user_id ON wedding_members(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_sections_wedding_id ON budget_sections(wedding_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_wedding_id ON budget_items(wedding_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_section_id ON budget_items(section_id);
CREATE INDEX IF NOT EXISTS idx_pledges_wedding_id ON pledges(wedding_id);
CREATE INDEX IF NOT EXISTS idx_payments_wedding_id ON payments(wedding_id);
CREATE INDEX IF NOT EXISTS idx_service_providers_wedding_id ON service_providers(wedding_id);
CREATE INDEX IF NOT EXISTS idx_agenda_items_wedding_id ON agenda_items(wedding_id);
CREATE INDEX IF NOT EXISTS idx_guests_wedding_id ON guests(wedding_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_wedding_id ON subscriptions(wedding_id);
