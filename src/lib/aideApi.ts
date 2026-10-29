import { supabase } from '@/lib/supabase';
import type { Meeting, MeetingInput } from '@/types/aide';

const MEETING_COLUMNS = 'id, title, meeting_date, start_time, end_time, location, notes';

export async function fetchMeetingsOnDay(dateKey: string): Promise<Meeting[]> {
  const { data, error } = await supabase
    .from('meetings')
    .select(MEETING_COLUMNS)
    .eq('meeting_date', dateKey)
    .order('start_time', { ascending: true });

  if (error) throw new Error('Could not load your meetings.');
  return (data ?? []) as Meeting[];
}

export async function fetchMeetingsInRange(fromKey: string, toKey: string): Promise<Meeting[]> {
  const { data, error } = await supabase
    .from('meetings')
    .select(MEETING_COLUMNS)
    .gte('meeting_date', fromKey)
    .lte('meeting_date', toKey)
    .order('meeting_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) throw new Error('Could not load your calendar.');
  return (data ?? []) as Meeting[];
}

export async function saveMeeting(input: MeetingInput, id: string | null): Promise<void> {
  const query = id
    ? supabase.from('meetings').update(input).eq('id', id).select('id').maybeSingle()
    : supabase.from('meetings').insert(input).select('id').maybeSingle();

  const { data, error } = await query;
  if (error) throw new Error('Could not save this meeting. Please try again.');
  if (!data) throw new Error('This meeting could not be saved. Please refresh and try again.');
}

export async function deleteMeeting(id: string): Promise<void> {
  const { data, error } = await supabase
    .from('meetings')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) throw new Error('Could not delete this meeting. Please try again.');
  if (!data) throw new Error('This meeting was already removed. Please refresh.');
}
