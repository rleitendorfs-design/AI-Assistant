import { useCallback } from 'react';
import { useAsyncList } from '@/hooks/useAsyncList';
import { fetchExpensesInRange } from '@/lib/expensesApi';
import { endOfMonth, startOfMonth, toDateKey } from '@/lib/dates';

export function useMonthExpenses(month: Date) {
  const fromKey = toDateKey(startOfMonth(month));
  const toKey = toDateKey(endOfMonth(month));
  const load = useCallback(() => fetchExpensesInRange(fromKey, toKey), [fromKey, toKey]);
  return useAsyncList(load);
}
