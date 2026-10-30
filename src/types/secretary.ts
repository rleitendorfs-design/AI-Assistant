export interface SecretarySettings {
  user_id: string;
  secretary_enabled: boolean;
  system_instructions: string;
  gmail_connected: boolean;
  gmail_address: string | null;
}

export type ActivityKind = 'email_processed' | 'draft_created' | 'automation_run' | 'calendar_sync';

export interface ActivityLog {
  id: string;
  kind: ActivityKind;
  title: string;
  detail: string | null;
  minutes_saved: number;
  created_at: string;
}

export interface CalendarRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  created_at: string;
}
