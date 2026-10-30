import { useMemo, useState } from 'react';
import { AlertCircle, Plus, Receipt, RotateCcw, UserRound } from 'lucide-react';
import ExpenseFormModal from '@/components/expenses/ExpenseFormModal';
import MonthSwitcher from '@/components/ui/MonthSwitcher';
import { useAsyncList } from '@/hooks/useAsyncList';
import { useMonthExpenses } from '@/hooks/useMonthExpenses';
import { fetchContacts } from '@/lib/contactsApi';
import { deleteExpense, saveExpense } from '@/lib/expensesApi';
import { EXPENSE_CATEGORY_LABELS } from '@/lib/expenseCategories';
import { addMonths, parseDateKey, startOfMonth, toDateKey } from '@/lib/dates';
import { formatCents } from '@/lib/money';
import type { Expense } from '@/types/aide';

const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
const dayFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

type Editor = { expense: Expense | null } | null;

export default function ExpensesPage() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const expenses = useMonthExpenses(month);
  const contacts = useAsyncList(fetchContacts);
  const [editor, setEditor] = useState<Editor>(null);

  const contactNames = useMemo(
    () => new Map(contacts.items.map((contact) => [contact.id, contact.name])),
    [contacts.items],
  );

  const total = expenses.items.reduce((sum, expense) => sum + expense.amount_cents, 0);
  const largest = expenses.items.reduce<Expense | null>(
    (top, expense) => (!top || expense.amount_cents > top.amount_cents ? expense : top),
    null,
  );

  const isReady = expenses.loadState === 'ready';

  return (
    <div>

      <main className="mx-auto max-w-5xl px-6 pb-20 pt-10 md:px-10 md:pt-14">
        <div className="animate-fade-up flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500">Spending</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Expenses</h1>
          </div>
          <div className="flex items-center gap-3">
            <MonthSwitcher
              label={monthFormatter.format(month)}
              onPrev={() => setMonth((current) => addMonths(current, -1))}
              onNext={() => setMonth((current) => addMonths(current, 1))}
            />
            <button
              type="button"
              onClick={() => setEditor({ expense: null })}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:bg-emerald-800 hover:shadow-md"
            >
              <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              Add
            </button>
          </div>
        </div>

        {expenses.loadState === 'error' && (
          <div role="alert" className="mt-8 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>{expenses.loadError}</p>
            </div>
            <button type="button" onClick={expenses.reload} className="inline-flex items-center gap-2 self-start font-medium text-red-900 underline-offset-4 hover:underline">
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Try again
            </button>
          </div>
        )}

        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Monthly summary">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-soft">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Total spent</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-neutral-900">{isReady ? formatCents(total) : '--'}</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-soft">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Entries</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-neutral-900">{isReady ? expenses.items.length : '--'}</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-soft">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Largest</p>
            <p className="mt-2 truncate text-base font-semibold text-neutral-900">
              {isReady && largest ? `${largest.merchant} · ${formatCents(largest.amount_cents)}` : 'Nothing yet'}
            </p>
          </div>
        </section>

        {expenses.loadState === 'loading' && <p className="mt-10 text-sm text-neutral-500">Loading expenses...</p>}

        {isReady && expenses.items.length === 0 && (
          <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-neutral-300 px-6 py-14 text-center">
            <Receipt className="h-7 w-7 text-emerald-700" strokeWidth={1.75} aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-neutral-800">No expenses this month</p>
            <p className="mt-1 text-sm text-neutral-500">Log a receipt to start tracking your spending.</p>
          </div>
        )}

        {isReady && expenses.items.length > 0 && (
          <ul className="mt-8 divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-soft">
            {expenses.items.map((expense) => {
              const contactName = expense.contact_id ? contactNames.get(expense.contact_id) : undefined;
              return (
                <li key={expense.id}>
                  <button
                    type="button"
                    onClick={() => setEditor({ expense })}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-emerald-50/50"
                  >
                    <div className="w-14 shrink-0 text-xs font-medium uppercase tracking-wide text-neutral-500">
                      {dayFormatter.format(parseDateKey(expense.expense_date))}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-neutral-900">{expense.merchant}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700">
                          {EXPENSE_CATEGORY_LABELS[expense.category]}
                        </span>
                        {contactName && (
                          <span className="flex items-center gap-1">
                            <UserRound className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                            {contactName}
                          </span>
                        )}
                        {expense.note && <span className="truncate">{expense.note}</span>}
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-neutral-900">
                      {formatCents(expense.amount_cents)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      {editor && (
        <ExpenseFormModal
          key={editor.expense?.id ?? 'new'}
          expense={editor.expense}
          contacts={contacts.items}
          defaultDateKey={defaultDateFor(month)}
          onClose={() => setEditor(null)}
          onSave={async (input) => {
            await saveExpense(input, editor.expense?.id ?? null);
            setEditor(null);
            expenses.reload();
          }}
          onDelete={async () => {
            if (!editor.expense) return;
            await deleteExpense(editor.expense.id);
            setEditor(null);
            expenses.reload();
          }}
        />
      )}
    </div>
  );
}

function defaultDateFor(month: Date) {
  const today = new Date();
  const inSelectedMonth = today.getMonth() === month.getMonth() && today.getFullYear() === month.getFullYear();
  return toDateKey(inSelectedMonth ? today : month);
}
