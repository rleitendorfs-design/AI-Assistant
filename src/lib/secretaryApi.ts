import { supabase } from '@/lib/supabase';
import type { ActivityLog, CalendarRule, SecretarySettings } from '@/types/secretary';

const SETTINGS_COLUMNS = 'user_id, secretary_enabled, system_instructions, gmail_connected, gmail_address';
const LOG_COLUMNS = 'id, kind, title, detail, minutes_saved, created_at';
const RULE_COLUMNS = 'id, name, description, enabled, created_at';
const ACTIVITY_WINDOW_DAYS = 7;
const ACTIVITY_LIMIT = 200;

export type SecretarySettingsPatch = Partial<
  Pick<SecretarySettings, 'secretary_enabled' | 'system_instructions' | 'gmail_connected' | 'gmail_address'>
>;

export async function fetchSecretarySettings(): Promise<SecretarySettings | null> {
  const { data, error } = await supabase.from('secretary_settings').select(SETTINGS_COLUMNS).maybeSingle();
  if (error) throw new Error('Could not load your secretary settings.');
  return (data as SecretarySettings | null) ?? null;
}

export async function updateSecretarySettings(patch: SecretarySettingsPatch): Promise<SecretarySettings> {
  const { data, error } = await supabase
    .from('secretary_settings')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .select(SETTINGS_COLUMNS)
    .maybeSingle();

  if (error) throw new Error('Could not save your changes. Please try again.');
  if (!data) throw new Error('Your settings could not be saved. Please refresh and try again.');
  return data as SecretarySettings;
}

export async function fetchRecentActivity(): Promise<ActivityLog[]> {
  const since = new Date(Date.now() - ACTIVITY_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('activity_logs')
    .select(LOG_COLUMNS)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(ACTIVITY_LIMIT);

  if (error) throw new Error('Could not load recent activity.');
  return (data ?? []) as ActivityLog[];
}

export async function fetchCalendarRules(): Promise<CalendarRule[]> {
  const { data, error } = await supabase
    .from('calendar_rules')
    .select(RULE_COLUMNS)
    .order('created_at', { ascending: true });

  if (error) throw new Error('Could not load your calendar rules.');
  return (data ?? []) as CalendarRule[];
}

export async function createCalendarRule(name: string, description: string): Promise<void> {
  const { data, error } = await supabase
    .from('calendar_rules')
    .insert({ name, description })
    .select('id')
    .maybeSingle();

  if (error) throw new Error('Could not create this rule. Please try again.');
  if (!data) throw new Error('This rule could not be saved. Please refresh and try again.');
}

export async function setCalendarRuleEnabled(id: string, enabled: boolean): Promise<void> {
  const { data, error } = await supabase
    .from('calendar_rules')
    .update({ enabled })
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) throw new Error('Could not update this rule. Please try again.');
  if (!data) throw new Error('This rule could not be updated. Please refresh.');
}

export async function deleteCalendarRule(id: string): Promise<void> {
  const { error } = await supabase.from('calendar_rules').delete().eq('id', id);
  if (error) throw new Error('Could not delete this rule. Please try again.');
}
