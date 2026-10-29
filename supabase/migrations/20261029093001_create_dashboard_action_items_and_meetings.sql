/*
# Create action items and meetings for the Aide dashboard

Plain-English summary
Aide's home screen shows the things that need the user's attention ("3 things need you today") and the day's meetings. This migration creates the two tables behind that screen and loads the starter content.

1. New Tables
- `action_items`: tasks waiting on the user.
  - `id` (uuid, primary key)
  - `title` (text, required): the headline shown on the card.
  - `detail` (text, optional): a short supporting line.
  - `category` (text): one of food, travel, finance, other. Controls the icon and the buttons on the card.
  - `amount_cents` (integer, optional): money involved, stored in cents.
  - `status` (text): pending, approved, declined, or completed. New items start as pending.
  - `sort_order` (integer): display order among pending items.
  - `created_at` (timestamptz)
- `meetings`: meetings on the day's strip.
  - `id` (uuid, primary key)
  - `title` (text, required)
  - `start_time` (time, required): wall-clock start time for today.
  - `location` (text, optional)
  - `created_at` (timestamptz)

2. Security
- Row level security is enabled on both tables.
- This app has no sign-in, so the data is intentionally shared. Policies allow the anon and authenticated roles to read, and action items can be updated (approve, decline, complete).
- Grants are limited to the verbs the app uses: action items can be read and updated, meetings can be read.
- No deletes or inserts are granted to the app itself. Rows are managed through this migration and future migrations.

3. Seed data
- Three starter action items (dinner order, train tickets, invoice) and four meetings are inserted only when the tables are empty, so re-running this migration never duplicates rows.

4. Important notes
- Nothing is dropped, renamed, or altered on existing tables; the tables are created with IF NOT EXISTS.
- Policies are dropped and recreated first so the migration can be safely re-applied.
*/

CREATE TABLE IF NOT EXISTS action_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  detail text,
  category text NOT NULL DEFAULT 'other' CHECK (category IN ('food', 'travel', 'finance', 'other')),
  amount_cents integer CHECK (amount_cents IS NULL OR amount_cents >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'completed')),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS action_items_status_sort_idx ON action_items (status, sort_order);

CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  start_time time NOT NULL,
  location text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

GRANT SELECT, UPDATE ON action_items TO anon, authenticated;
GRANT SELECT ON meetings TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_action_items" ON action_items;
CREATE POLICY "anon_select_action_items" ON action_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_update_action_items" ON action_items;
CREATE POLICY "anon_update_action_items" ON action_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_meetings" ON meetings;
CREATE POLICY "anon_select_meetings" ON meetings FOR SELECT
  TO anon, authenticated USING (true);

INSERT INTO action_items (title, detail, category, amount_cents, sort_order)
SELECT * FROM (VALUES
  ('Approve dinner order from Sweetgreen', 'Harvest Bowl and two sides for the team dinner', 'food', 2400, 1),
  ('Confirm train tickets to Boston', 'Friday, 8:05 AM departure, two seats', 'travel', NULL, 2),
  ('Review invoice from Acme Design', 'Q3 brand refresh, net 30 terms', 'finance', 384000, 3)
) AS seed(title, detail, category, amount_cents, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM action_items);

INSERT INTO meetings (title, start_time, location)
SELECT * FROM (VALUES
  ('Team Sync', TIME '09:30', 'Room 4B'),
  ('Product Roadmap', TIME '11:00', 'Video call'),
  ('Client Call: Stellar Corp', TIME '14:00', 'Video call'),
  ('1:1 with Sarah', TIME '16:30', 'Office')
) AS seed(title, start_time, location)
WHERE NOT EXISTS (SELECT 1 FROM meetings);
