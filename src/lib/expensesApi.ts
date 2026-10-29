import { supabase } from '@/lib/supabase';
import type { Expense, ExpenseInput } from '@/types/aide';

const EXPENSE_COLUMNS = 'id, merchant, amount_cents, category, expense_date, note, contact_id';

export async function fetchExpensesInRange(fromKey: string, toKey: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select(EXPENSE_COLUMNS)
    .gte('expense_date', fromKey)
    .lte('expense_date', toKey)
    .order('expense_date', { ascending: false });

  if (error) throw new Error('Could not load your expenses.');
  return (data ?? []) as Expense[];
}

export async function saveExpense(input: ExpenseInput, id: string | null): Promise<void> {
  const query = id
    ? supabase.from('expenses').update(input).eq('id', id).select('id').maybeSingle()
    : supabase.from('expenses').insert(input).select('id').maybeSingle();

  const { data, error } = await query;
  if (error) throw new Error('Could not save this expense. Please try again.');
  if (!data) throw new Error('This expense could not be saved. Please refresh and try again.');
}

export async function deleteExpense(id: string): Promise<void> {
  const { data, error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) throw new Error('Could not delete this expense. Please try again.');
  if (!data) throw new Error('This expense was already removed. Please refresh.');
}
