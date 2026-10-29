/*
# Extend meetings for the calendar view

Plain-English summary
Meetings previously had only a start time, so they could not be placed on a calendar. This migration adds a date, an optional end time, and notes, and lets the app create, edit, and delete meetings.

1. Modified table: `meetings`
- `meeting_date` (date, required): the day the meeting happens. Existing meetings are set to the day this migration runs.
- `end_time` (time, optional): when the meeting finishes. Must be after the start time when provided.
- `notes` (text, optional): free-form details for the meeting.
- An index on (meeting_date, start_time) keeps day and month lookups fast.

2. Security
- Row level security stays enabled.
- The app has no sign-in, so the shared calendar is intentionally readable and writable by the anon and authenticated roles.
- INSERT, UPDATE, and DELETE are granted to anon and authenticated, with matching policies, so the calendar can manage meetings.

3. Important notes
- No existing columns are dropped, renamed, or retyped.
- Column additions and the constraint are guarded so the migration can be safely re-applied.
- Policies are dropped and recreated before being created.
*/

ALTER TABLE meetings ADD COLUMN IF NOT EXISTS meeting_date date NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS end_time time;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS notes text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'meetings_end_after_start' AND conrelid = 'meetings'::regclass
  ) THEN
    ALTER TABLE meetings ADD CONSTRAINT meetings_end_after_start
      CHECK (end_time IS NULL OR end_time > start_time);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS meetings_date_start_idx ON meetings (meeting_date, start_time);

GRANT SELECT, INSERT, UPDATE, DELETE ON meetings TO anon, authenticated;

DROP POLICY IF EXISTS "anon_insert_meetings" ON meetings;
CREATE POLICY "anon_insert_meetings" ON meetings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_meetings" ON meetings;
CREATE POLICY "anon_update_meetings" ON meetings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_meetings" ON meetings;
CREATE POLICY "anon_delete_meetings" ON meetings FOR DELETE
  TO anon, authenticated USING (true);
