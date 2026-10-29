/*
# Scope Aide data to signed-in accounts

Plain-English summary
Aide now has accounts. Each person signs in and sees only the action items, meetings, contacts, expenses, and invoices they created. The shared, no-sign-in access is removed.

1. Modified tables
- `action_items`, `meetings`, `contacts`, `expenses`, `invoices` each gain a `user_id` column.
  - It defaults to the signed-in user, so the app does not need to send it.
  - It links to the Supabase login record, and rows are removed if an account is deleted.
- Rows that already exist have no owner. They are kept, not deleted, and are hidden from every account. Nothing is lost.

2. Security
- The anon role loses all access to these tables. Only signed-in users (authenticated role) can reach them.
- Each table has policies that only allow a user to read, create, change, or delete rows where `user_id` is their own ID.
- Grants are limited to the actions the app uses on each table.
- Row level security stays enabled on every table.
- The old shared-access policies are removed.

3. Important notes
- Accounts start with an empty dashboard, calendar, contacts, expenses, and invoices.
- Sample data from earlier setup remains in the database with no owner and is not visible to any account.
- Policies are dropped and recreated first so the migration can be re-applied safely.
*/

-- Owner columns
ALTER TABLE action_items ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS action_items_user_idx ON action_items (user_id);
CREATE INDEX IF NOT EXISTS meetings_user_idx ON meetings (user_id);
CREATE INDEX IF NOT EXISTS contacts_user_idx ON contacts (user_id);
CREATE INDEX IF NOT EXISTS expenses_user_idx ON expenses (user_id);
CREATE INDEX IF NOT EXISTS invoices_user_idx ON invoices (user_id);

-- Remove shared access
DROP POLICY IF EXISTS "anon_select_action_items" ON action_items;
DROP POLICY IF EXISTS "anon_update_action_items" ON action_items;
DROP POLICY IF EXISTS "anon_select_meetings" ON meetings;
DROP POLICY IF EXISTS "anon_insert_meetings" ON meetings;
DROP POLICY IF EXISTS "anon_update_meetings" ON meetings;
DROP POLICY IF EXISTS "anon_delete_meetings" ON meetings;
DROP POLICY IF EXISTS "anon_select_contacts" ON contacts;
DROP POLICY IF EXISTS "anon_insert_contacts" ON contacts;
DROP POLICY IF EXISTS "anon_update_contacts" ON contacts;
DROP POLICY IF EXISTS "anon_delete_contacts" ON contacts;
DROP POLICY IF EXISTS "anon_select_expenses" ON expenses;
DROP POLICY IF EXISTS "anon_insert_expenses" ON expenses;
DROP POLICY IF EXISTS "anon_update_expenses" ON expenses;
DROP POLICY IF EXISTS "anon_delete_expenses" ON expenses;
DROP POLICY IF EXISTS "anon_select_invoices" ON invoices;
DROP POLICY IF EXISTS "anon_insert_invoices" ON invoices;
DROP POLICY IF EXISTS "anon_update_invoices" ON invoices;
DROP POLICY IF EXISTS "anon_delete_invoices" ON invoices;

REVOKE ALL ON action_items, meetings, contacts, expenses, invoices FROM anon;

-- Grants for signed-in users
GRANT SELECT, UPDATE ON action_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON meetings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON contacts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON expenses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON invoices TO authenticated;

-- Owner-only policies
DROP POLICY IF EXISTS "owner_select_action_items" ON action_items;
CREATE POLICY "owner_select_action_items" ON action_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "owner_update_action_items" ON action_items;
CREATE POLICY "owner_update_action_items" ON action_items FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_select_meetings" ON meetings;
CREATE POLICY "owner_select_meetings" ON meetings FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "owner_insert_meetings" ON meetings;
CREATE POLICY "owner_insert_meetings" ON meetings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "owner_update_meetings" ON meetings;
CREATE POLICY "owner_update_meetings" ON meetings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "owner_delete_meetings" ON meetings;
CREATE POLICY "owner_delete_meetings" ON meetings FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_select_contacts" ON contacts;
CREATE POLICY "owner_select_contacts" ON contacts FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "owner_insert_contacts" ON contacts;
CREATE POLICY "owner_insert_contacts" ON contacts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "owner_update_contacts" ON contacts;
CREATE POLICY "owner_update_contacts" ON contacts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "owner_delete_contacts" ON contacts;
CREATE POLICY "owner_delete_contacts" ON contacts FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_select_expenses" ON expenses;
CREATE POLICY "owner_select_expenses" ON expenses FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "owner_insert_expenses" ON expenses;
CREATE POLICY "owner_insert_expenses" ON expenses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "owner_update_expenses" ON expenses;
CREATE POLICY "owner_update_expenses" ON expenses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "owner_delete_expenses" ON expenses;
CREATE POLICY "owner_delete_expenses" ON expenses FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_select_invoices" ON invoices;
CREATE POLICY "owner_select_invoices" ON invoices FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "owner_insert_invoices" ON invoices;
CREATE POLICY "owner_insert_invoices" ON invoices FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "owner_update_invoices" ON invoices;
CREATE POLICY "owner_update_invoices" ON invoices FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "owner_delete_invoices" ON invoices;
CREATE POLICY "owner_delete_invoices" ON invoices FOR DELETE TO authenticated USING (auth.uid() = user_id);
