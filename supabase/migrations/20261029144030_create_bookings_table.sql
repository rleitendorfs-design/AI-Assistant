/*
# Create bookings table

Plain-English summary
Signed-in users can record their trips and reservations (flights, stays, and other bookings) inside Aide. Each person sees only the bookings they created. Bookings are recorded here; the actual reservation and payment happen on the provider's own website.

1. New tables
- `bookings`
  - `id` (uuid, primary key)
  - `user_id` (uuid, defaults to the signed-in user, links to the login record)
  - `kind` (text: flight, stay, or other)
  - `title` (text, required, e.g. "Flight to Lisbon")
  - `provider` (text, optional, e.g. "Booking.com" or "Skyscanner")
  - `confirmation_code` (text, optional)
  - `location` (text, optional)
  - `starts_on` (date, required)
  - `ends_on` (date, optional, must be on or after the start date)
  - `amount_cents` (integer, optional, zero or more)
  - `status` (text: planned, booked, or cancelled; defaults to planned)
  - `notes` (text, optional)
  - `created_at` (timestamp)

2. Security
- Row level security is enabled.
- The anon role has no access. Only signed-in users (authenticated role) can reach the table.
- Policies allow each user to read, create, change, and delete only rows where `user_id` is their own ID.
- Grants are limited to the actions the app uses.

3. Important notes
- The table is new, so no existing data is changed or removed.
- Policies are dropped and recreated first so the migration can be re-applied safely.
*/

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'other' CHECK (kind IN ('flight', 'stay', 'other')),
  title text NOT NULL,
  provider text,
  confirmation_code text,
  location text,
  starts_on date NOT NULL,
  ends_on date,
  amount_cents integer CHECK (amount_cents IS NULL OR amount_cents >= 0),
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'booked', 'cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_on IS NULL OR ends_on >= starts_on)
);

CREATE INDEX IF NOT EXISTS bookings_user_idx ON bookings (user_id);
CREATE INDEX IF NOT EXISTS bookings_user_starts_idx ON bookings (user_id, starts_on);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON bookings FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON bookings TO authenticated;

DROP POLICY IF EXISTS "owner_select_bookings" ON bookings;
CREATE POLICY "owner_select_bookings" ON bookings FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_insert_bookings" ON bookings;
CREATE POLICY "owner_insert_bookings" ON bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_update_bookings" ON bookings;
CREATE POLICY "owner_update_bookings" ON bookings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_delete_bookings" ON bookings;
CREATE POLICY "owner_delete_bookings" ON bookings FOR DELETE TO authenticated USING (auth.uid() = user_id);
