import { supabase } from '@/lib/supabase';
import type { Invoice, InvoiceInput, InvoiceStatus } from '@/types/aide';

const INVOICE_COLUMNS = 'id, invoice_number, client_name, amount_cents, issued_on, due_on, status';

export async function fetchInvoices(): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select(INVOICE_COLUMNS)
    .order('due_on', { ascending: true });

  if (error) throw new Error('Could not load your invoices.');
  return (data ?? []) as Invoice[];
}

export async function saveInvoice(input: InvoiceInput, id: string | null): Promise<void> {
  const query = id
    ? supabase.from('invoices').update(input).eq('id', id).select('id').maybeSingle()
    : supabase.from('invoices').insert(input).select('id').maybeSingle();

  const { data, error } = await query;
  if (error) throw new Error('Could not save this invoice. Please try again.');
  if (!data) throw new Error('This invoice could not be saved. Please refresh and try again.');
}

export async function deleteInvoice(id: string): Promise<void> {
  const { data, error } = await supabase.from('invoices').delete().eq('id', id).select('id').maybeSingle();

  if (error) throw new Error('Could not delete this invoice. Please try again.');
  if (!data) throw new Error('This invoice was already removed. Please refresh.');
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<void> {
  const { data, error } = await supabase
    .from('invoices')
    .update({ status })
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) throw new Error('Could not update this invoice. Please try again.');
  if (!data) throw new Error('This invoice could not be updated. Please refresh.');
}
