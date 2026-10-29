/*
# Restrict public table privileges to what the dashboard uses

Plain-English summary
New tables in this project inherited broad default privileges that let the public key insert and delete rows. This migration removes everything the app does not use.

1. Modified tables
- `action_items`: anon and authenticated keep SELECT and UPDATE only. INSERT and DELETE are revoked.
- `meetings`: anon and authenticated keep SELECT only. INSERT, UPDATE, and DELETE are revoked.

2. Security
- No table structure or data is changed.
- Row level security stays enabled; the read and update policies from the previous migration still apply.

3. Important notes
- Revoking a privilege that was never used by the app cannot lose data.
*/

REVOKE INSERT, DELETE ON action_items FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON meetings FROM anon, authenticated;
