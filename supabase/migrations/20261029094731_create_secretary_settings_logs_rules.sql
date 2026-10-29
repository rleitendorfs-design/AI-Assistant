/*
# Create secretary settings, activity log and calendar rules

1. New Tables
- `secretary_settings`: one row per user. Holds the AI secretary on/off switch, custom system instructions, and the simulated Gmail connection state.
- `activity_logs`: a feed of what the secretary has done for the user (emails processed, drafts created, automations run).
- `calendar_rules`: scheduling rules the secretary follows (e.g. "Offer Tuesday afternoons"). Each rule can be enabled or disabled.

2. Seeding
- A trigger on new sign-ups creates default settings, sample activity, and sample calendar rules for the new account.
- Existing accounts receive the same defaults once, if they have none yet.

3. Security
- Row level security is enabled on all three tables.
- Each table is owner-scoped: users can only read and write rows where user_id = auth.uid().
- Activity logs are read-only for the app; they are written only by the seeding routine and the secretary.
- The seeding helper is SECURITY DEFINER and cannot be called directly by anon or authenticated users.

4. Notes
- user_id defaults to auth.uid(), so inserts from the app do not need to pass it.
*/

CREATE TABLE IF NOT EXISTS secretary_settings (
  user_id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  secretary_enabled boolean NOT NULL DEFAULT true,
  system_instructions text NOT NULL DEFAULT '',
  gmail_connected boolean NOT NULL DEFAULT false,
  gmail_address text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('email_processed', 'draft_created', 'automation_run', 'calendar_sync')),
  title text NOT NULL,
  detail text,
  minutes_saved integer NOT NULL DEFAULT 0 CHECK (minutes_saved >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activity_logs_user_created_idx ON activity_logs (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS calendar_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) > 0),
  description text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS calendar_rules_user_idx ON calendar_rules (user_id);

ALTER TABLE secretary_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_rules ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON secretary_settings TO authenticated;
GRANT SELECT ON activity_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON calendar_rules TO authenticated;

DROP POLICY IF EXISTS "select_own_secretary_settings" ON secretary_settings;
CREATE POLICY "select_own_secretary_settings" ON secretary_settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_secretary_settings" ON secretary_settings;
CREATE POLICY "insert_own_secretary_settings" ON secretary_settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_secretary_settings" ON secretary_settings;
CREATE POLICY "update_own_secretary_settings" ON secretary_settings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_own_activity_logs" ON activity_logs;
CREATE POLICY "select_own_activity_logs" ON activity_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_own_calendar_rules" ON calendar_rules;
CREATE POLICY "select_own_calendar_rules" ON calendar_rules FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_calendar_rules" ON calendar_rules;
CREATE POLICY "insert_own_calendar_rules" ON calendar_rules FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_calendar_rules" ON calendar_rules;
CREATE POLICY "update_own_calendar_rules" ON calendar_rules FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_calendar_rules" ON calendar_rules;
CREATE POLICY "delete_own_calendar_rules" ON calendar_rules FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION seed_secretary_defaults(target_user uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO secretary_settings (user_id, system_instructions)
  VALUES (
    target_user,
    'Be polite and concise. Sign off as Executive Assistant. Offer Tuesday afternoons for meetings.'
  )
  ON CONFLICT (user_id) DO NOTHING;

  IF NOT EXISTS (SELECT 1 FROM activity_logs WHERE user_id = target_user) THEN
    INSERT INTO activity_logs (user_id, kind, title, detail, minutes_saved, created_at) VALUES
      (target_user, 'email_processed', 'Sorted 14 new emails into priority inbox', 'Three flagged as urgent', 12, now() - interval '1 hour'),
      (target_user, 'draft_created', 'Drafted response to John Doe regarding meeting scheduling', 'Offered Tuesday 2:00 PM and Tuesday 3:30 PM', 6, now() - interval '3 hours'),
      (target_user, 'calendar_sync', 'Blocked focus time on Thursday morning', 'Based on your calendar rules', 4, now() - interval '5 hours'),
      (target_user, 'draft_created', 'Drafted reply to Priya Shah confirming the invoice', 'Sign-off: Executive Assistant', 5, now() - interval '1 day'),
      (target_user, 'automation_run', 'Declined a conflicting invitation from Marketing Sync', 'Overlapped with a protected block', 3, now() - interval '2 days');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM calendar_rules WHERE user_id = target_user) THEN
    INSERT INTO calendar_rules (user_id, name, description, enabled) VALUES
      (target_user, 'Offer Tuesday afternoons', 'Suggest Tuesday between 1:00 and 5:00 PM for new meeting requests.', true),
      (target_user, 'Protect morning focus time', 'Decline meetings before 10:00 AM on weekdays.', true),
      (target_user, 'Buffer between meetings', 'Keep a 15 minute gap after every external call.', false);
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION seed_secretary_defaults(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION handle_new_user_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM seed_secretary_defaults(NEW.id);
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION handle_new_user_defaults() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created_secretary ON auth.users;
CREATE TRIGGER on_auth_user_created_secretary
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_defaults();

DO $$
DECLARE
  account RECORD;
BEGIN
  FOR account IN SELECT id FROM auth.users LOOP
    PERFORM seed_secretary_defaults(account.id);
  END LOOP;
END;
$$;
