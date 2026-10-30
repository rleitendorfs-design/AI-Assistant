import { useMemo, useState } from 'react';
import { AlertCircle, Plus, RotateCcw, Wallet } from 'lucide-react';
import InvoiceFormModal from '@/components/accounting/InvoiceFormModal';
import MonthSwitcher from '@/components/ui/MonthSwitcher';
import { useAsyncList } from '@/hooks/useAsyncList';
import { useMonthExpenses } from '@/hooks/useMonthExpenses';
import { EXPENSE_CATEGORY_LABELS } from '@/lib/expenseCategories';
import { addDays, addMonths, parseDateKey, startOfMonth, toDateKey } from '@/lib/dates';
import { deleteInvoice, fetchInvoices, saveInvoice, updateInvoiceStatus } from '@/lib/invoicesApi';
import { formatCents } from '@/lib/money';
import { EXPENSE_CATEGORIES, type Invoice, type InvoiceStatus } from '@/types/aide';

const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
const dayFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

type Editor = { invoice: Invoice | null } | null;

export default function AccountingPage() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const expenses = useMonthExpenses(month);
  const invoices = useAsyncList(fetchInvoices);
  const [editor, setEditor] = useState<Editor>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [busyInvoiceId, setBusyInvoiceId] = useState<string | null>(null);

  const todayKey = toDateKey(new Date());
  const isReady = expenses.loadState === 'ready' && invoices.loadState === 'ready';

  const spentTotal = expenses.items.reduce((sum, expense) => sum + expense.amount_cents, 0);

  const byCategory = useMemo(() => {
    const totals = new Map<string, number>(EXPENSE_CATEGORIES.map((category) => [category, 0]));
    for (const expense of expenses.items) {
      totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amount_cents);
    }
    return EXPENSE_CATEGORIES.map((category) => ({ category, total: totals.get(category) ?? 0 }))
      .sort((a, b) => b.total - a.total);
  }, [expenses.items]);

  const openInvoices = invoices.items.filter((invoice) => invoice.status === 'open');
  const overdueInvoices = openInvoices.filter((invoice) => invoice.due_on < todayKey);
  const openTotal = openInvoices.reduce((sum, invoice) => sum + invoice.amount_cents, 0);
  const overdueTotal = overdueInvoices.reduce((sum, invoice) => sum + invoice.amount_cents, 0);

  async function handleStatusToggle(invoice: Invoice) {
    const next: InvoiceStatus = invoice.status === 'open' ? 'paid' : 'open';
    setBusyInvoiceId(invoice.id);
    setStatusError(null);
    try {
      await updateInvoiceStatus(invoice.id, next);
      invoices.reload();
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'Could not update this invoice.');
    } finally {
      setBusyInvoiceId(null);
    }
  }

  return (
    <div>
      <div className="animate-fade-up flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">Money in and out</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Accounting</h1>
        </div>
        <div className="flex items-center gap-3">
          <MonthSwitcher
            label={monthFormatter.format(month)}
            onPrev={() => setMonth((current) => addMonths(current, -1))}
            onNext={() => setMonth((current) => addMonths(current, 1))}
          />
        </div>
      </div>

      {(expenses.loadState === 'error' || invoices.loadState === 'error') && (
        <div role="alert" className="mt-8 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>{expenses.loadError ?? invoices.loadError}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              expenses.reload();
              invoices.reload();
            }}
            className="inline-flex items-center gap-2 self-start font-medium text-red-900 underline-offset-4 hover:underline"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
        </div>
      )}

      <section aria-label="Accounting summary" className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Spent this month</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{isReady ? formatCents(spentTotal) : '--'}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Open invoices</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{isReady ? formatCents(openTotal) : '--'}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Overdue</p>
          <p className={`mt-2 text-2xl font-semibold tabular-nums ${overdueInvoices.length > 0 ? 'text-red-700' : ''}`}>
            {isReady ? `${overdueInvoices.length} · ${formatCents(overdueTotal)}` : '--'}
          </p>
        </div>
      </section>

      <section aria-label="Spending by category" className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-soft">
        <h2 className="text-base font-semibold">Spending by category</h2>
        {isReady && spentTotal === 0 && <p className="mt-4 text-sm text-neutral-500">No expenses this month.</p>}
        <ul className="mt-5 space-y-4">
          {byCategory.map(({ category, total }) => {
            const width = spentTotal > 0 ? Math.round((total / spentTotal) * 100) : 0;
            return (
              <li key={category}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-neutral-800">{EXPENSE_CATEGORY_LABELS[category]}</span>
                  <span className="tabular-nums text-neutral-600">{formatCents(total)}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-label="Invoices" className="mt-10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Invoices</h2>
          <button
            type="button"
            onClick={() => setEditor({ invoice: null })}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:bg-emerald-800 hover:shadow-md"
          >
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            New invoice
          </button>
        </div>

        {statusError && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {statusError}
          </p>
        )}

        {invoices.loadState === 'loading' && <p className="mt-6 text-sm text-neutral-500">Loading invoices...</p>}

        {invoices.loadState === 'ready' && invoices.items.length === 0 && (
          <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-neutral-300 px-6 py-14 text-center">
            <Wallet className="h-7 w-7 text-emerald-700" strokeWidth={1.75} aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-neutral-800">No invoices yet</p>
            <p className="mt-1 text-sm text-neutral-500">Create an invoice to start tracking what is owed to you.</p>
          </div>
        )}

        {invoices.loadState === 'ready' && invoices.items.length > 0 && (
          <ul className="mt-6 divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-soft">
            {invoices.items.map((invoice) => {
              const overdue = invoice.status === 'open' && invoice.due_on < todayKey;
              const busy = busyInvoiceId === invoice.id;
              return (
                <li key={invoice.id} className="flex items-center gap-4 px-5 py-4">
                  <button
                    type="button"
                    onClick={() => setEditor({ invoice })}
                    className="min-w-0 flex-1 text-left transition-colors hover:text-emerald-800"
                  >
                    <p className="truncate text-sm font-semibold text-neutral-900">
                      {invoice.invoice_number} · {invoice.client_name}
                    </p>
                    <p className={`mt-1 text-xs ${overdue ? 'font-medium text-red-700' : 'text-neutral-500'}`}>
                      Due {dayFormatter.format(parseDateKey(invoice.due_on))}
                      {overdue ? ' · Overdue' : ''}
                    </p>
                  </button>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">{formatCents(invoice.amount_cents)}</span>
                  <button
                    type="button"
                    onClick={() => handleStatusToggle(invoice)}
                    disabled={busy}
                    aria-label={`Mark invoice ${invoice.invoice_number} as ${invoice.status === 'open' ? 'paid' : 'open'}`}
                    className={`w-20 shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-60 ${
                      invoice.status === 'paid'
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {busy ? '...' : invoice.status === 'paid' ? 'Paid' : 'Open'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {editor && (
        <InvoiceFormModal
          key={editor.invoice?.id ?? 'new'}
          invoice={editor.invoice}
          defaultIssuedKey={todayKey}
          defaultDueKey={toDateKey(addDays(new Date(), 30))}
          onClose={() => setEditor(null)}
          onSave={async (input) => {
            await saveInvoice(input, editor.invoice?.id ?? null);
            setEditor(null);
            invoices.reload();
          }}
          onDelete={async () => {
            if (!editor.invoice) return;
            await deleteInvoice(editor.invoice.id);
            setEditor(null);
            invoices.reload();
          }}
        />
      )}
    </div>
  );
}
