import { supabase } from '@/lib/supabase';
import type { Booking, BookingInput } from '@/types/aide';

const BOOKING_COLUMNS = 'id, kind, title, provider, confirmation_code, location, starts_on, ends_on, amount_cents, status, notes';

export async function fetchBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_COLUMNS)
    .order('starts_on', { ascending: true });

  if (error) throw new Error('Could not load your bookings.');
  return (data ?? []) as Booking[];
}

export async function saveBooking(input: BookingInput, id: string | null): Promise<void> {
  const query = id
    ? supabase.from('bookings').update(input).eq('id', id).select('id').maybeSingle()
    : supabase.from('bookings').insert(input).select('id').maybeSingle();

  const { data, error } = await query;
  if (error) throw new Error('Could not save this booking. Please try again.');
  if (!data) throw new Error('This booking could not be saved. Please refresh and try again.');
}

export async function deleteBooking(id: string): Promise<void> {
  const { data, error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) throw new Error('Could not delete this booking. Please try again.');
  if (!data) throw new Error('This booking was already removed. Please refresh.');
}
