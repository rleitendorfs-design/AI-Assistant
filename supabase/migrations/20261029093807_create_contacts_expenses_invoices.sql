/*
# Create contacts, expenses, and invoices

Plain-English summary
Adds three areas to Aide: a contact list, an expense tracker (where spending is logged, optionally linked to a contact), and invoices that feed the accounting tab.

1. New Tables
- `contacts`: people and companies the user works with.
  - name (required), company, role, email, phone, notes, created_at
- `expenses`: money spent.
  - merchant (required), amount_cents (required, above zero), category (meals, travel, lodging, software, office, other), expense_date (defaults to today), note, contact_id (optional link to a contact)
- `invoices`: bills the user has issued or is owed.
  - invoice_number (required), client_name (required), amount_cents (required, above zero), issued_on, due_on (not before issued_on), status (open or paid), created_at

2. Relationships
- An expense may point to one contact. If that contact is deleted, the expense stays and its link is cleared.

3. Security
- Row level security is enabled on all three tables.
- The app has no sign-in, so these tables are shared and readable and writable by the anon and authenticated roles, with a policy for each action.
- Grants are given explicitly for the verbs the app uses on each table.

4. Seed data
- Starter contacts, expenses, and invoices are inserted only when each table is empty, so re-running this migration never duplicates rows.

5. Important notes
- Nothing existing is changed.
- Policies are dropped and recreated first so the migration can be safely re-applied.
*/

CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(btrim(name)) > 0),
  company text,
  role text,
  email text,
  phone text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant text NOT NULL CHECK (length(btrim(merchant)) > 0),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  category text NOT NULL DEFAULT 'other' CHECK (category IN ('meals', 'travel', 'lodging', 'software', 'office', 'other')),
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  note text,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS expenses_date_idx ON expenses (expense_date);
CREATE INDEX IF NOT EXISTS expenses_contact_idx ON expenses (contact_id);

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL CHECK (length(btrim(invoice_number)) > 0),
  client_name text NOT NULL CHECK (length(btrim(client_name)) > 0),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  issued_on date NOT NULL DEFAULT CURRENT_DATE,
  due_on date NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'paid')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (due_on >= issued_on)
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON contacts TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON expenses TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON invoices TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_contacts" ON contacts;
CREATE POLICY "anon_select_contacts" ON contacts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_contacts" ON contacts;
CREATE POLICY "anon_insert_contacts" ON contacts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_contacts" ON contacts;
CREATE POLICY "anon_update_contacts" ON contacts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_contacts" ON contacts;
CREATE POLICY "anon_delete_contacts" ON contacts FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_expenses" ON expenses;
CREATE POLICY "anon_select_expenses" ON expenses FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_expenses" ON expenses;
CREATE POLICY "anon_insert_expenses" ON expenses FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_expenses" ON expenses;
CREATE POLICY "anon_update_expenses" ON expenses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_expenses" ON expenses;
CREATE POLICY "anon_delete_expenses" ON expenses FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_invoices" ON invoices;
CREATE POLICY "anon_select_invoices" ON invoices FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_invoices" ON invoices;
CREATE POLICY "anon_insert_invoices" ON invoices FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_invoices" ON invoices;
CREATE POLICY "anon_update_invoices" ON invoices FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_invoices" ON invoices;
CREATE POLICY "anon_delete_invoices" ON invoices FOR DELETE TO anon, authenticated USING (true);

INSERT INTO contacts (name, company, role, email, phone, notes)
SELECT * FROM (VALUES
  ('Sarah Mitchell', 'Aide Team', 'Operations Lead', 'sarah.mitchell@example.com', '555-0142', 'Runs the weekly sync. Prefers morning check-ins.'),
  ('Marcus Hale', 'Stellar Corp', 'Client Partner', 'marcus.hale@example.com', '555-0187', 'Main contact for the Q4 rollout.'),
  ('Priya Nair', 'Acme Design', 'Creative Director', 'priya.nair@example.com', '555-0113', 'Sends invoices from the studio billing address.'),
  ('Dan Ortiz', 'Harbor Travel', 'Travel Agent', 'dan.ortiz@example.com', '555-0199', 'Books Boston trips and rail tickets.')
) AS seed(name, company, role, email, phone, notes)
WHERE NOT EXISTS (SELECT 1 FROM contacts);

INSERT INTO expenses (merchant, amount_cents, category, expense_date, note)
SELECT * FROM (VALUES
  ('Sweetgreen', 2400, 'meals', CURRENT_DATE - 1, 'Team dinner order'),
  ('Amtrak', 8900, 'travel', CURRENT_DATE - 2, 'Round trip to Boston'),
  ('Hotel Marlowe', 31800, 'lodging', CURRENT_DATE - 3, 'Two nights, client visit'),
  ('Figma', 1500, 'software', CURRENT_DATE - 5, 'Monthly seat'),
  ('Staples', 4262, 'office', CURRENT_DATE - 7, 'Printer paper and notebooks'),
  ('Blue Bottle Coffee', 875, 'meals', CURRENT_DATE - 8, NULL)
) AS seed(merchant, amount_cents, category, expense_date, note)
WHERE NOT EXISTS (SELECT 1 FROM expenses);

INSERT INTO invoices (invoice_number, client_name, amount_cents, issued_on, due_on, status)
SELECT * FROM (VALUES
  ('INV-1042', 'Acme Design', 384000, CURRENT_DATE - 10, CURRENT_DATE + 4, 'open'),
  ('INV-1039', 'Stellar Corp', 1250000, CURRENT_DATE - 30, CURRENT_DATE - 3, 'open'),
  ('INV-1031', 'Harbor Travel', 42000, CURRENT_DATE - 45, CURRENT_DATE - 15, 'paid')
) AS seed(invoice_number, client_name, amount_cents, issued_on, due_on, status)
WHERE NOT EXISTS (SELECT 1 FROM invoices);
