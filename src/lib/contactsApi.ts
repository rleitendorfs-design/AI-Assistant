import { supabase } from '@/lib/supabase';
import type { Contact, ContactInput } from '@/types/aide';

const CONTACT_COLUMNS = 'id, name, company, role, email, phone, notes';

export async function fetchContacts(): Promise<Contact[]> {
  const { data, error } = await supabase
    .from('contacts')
    .select(CONTACT_COLUMNS)
    .order('name', { ascending: true });

  if (error) throw new Error('Could not load your contacts.');
  return (data ?? []) as Contact[];
}

export async function saveContact(input: ContactInput, id: string | null): Promise<void> {
  const query = id
    ? supabase.from('contacts').update(input).eq('id', id).select('id').maybeSingle()
    : supabase.from('contacts').insert(input).select('id').maybeSingle();

  const { data, error } = await query;
  if (error) throw new Error('Could not save this contact. Please try again.');
  if (!data) throw new Error('This contact could not be saved. Please refresh and try again.');
}

export async function deleteContact(id: string): Promise<void> {
  const { data, error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) throw new Error('Could not delete this contact. Please try again.');
  if (!data) throw new Error('This contact was already removed. Please refresh.');
}
