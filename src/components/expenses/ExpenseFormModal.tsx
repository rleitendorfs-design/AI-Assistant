import { useState, type FormEvent } from 'react';
import Field, { inputClass } from '@/components/ui/Field';
import FormActions from '@/components/ui/FormActions';
import Modal from '@/components/ui/Modal';
import { EXPENSE_CATEGORY_LABELS } from '@/lib/expenseCategories';
import { centsToDollarInput, parseDollarsToCents } from '@/lib/money';
import { EXPENSE_CATEGORIES, type Contact, type Expense, type ExpenseCategory, type ExpenseInput } from '@/types/aide';

interface ExpenseFormModalProps {
  expense: Expense | null;
  contacts: Contact[];
  defaultDateKey: string;
  onSave: (input: ExpenseInput) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
}

interface FormState {
  merchant: string;
  amount: string;
  expense_date: string;
  category: ExpenseCategory;
  contact_id: string;
  note: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

function initialState(expense: Expense | null, defaultDateKey: string): FormState {
  return {
    merchant: expense?.merchant ?? '',
    amount: expense ? centsToDollarInput(expense.amount_cents) : '',
    expense_date: expense?.expense_date ?? defaultDateKey,
    category: expense?.category ?? 'meals',
    contact_id: expense?.contact_id ?? '',
    note: expense?.note ?? '',
  };
}

function validate(form: FormState): { errors: FormErrors; cents: number | null } {
  const errors: FormErrors = {};
  const cents = parseDollarsToCents(form.amount);
  if (!form.merchant.trim()) errors.merchant = 'Enter who the money went to.';
  if (cents === null) errors.amount = 'Enter an amount greater than zero, such as 24.50.';
  if (!form.expense_date) errors.expense_date = 'Choose a date.';
  return { errors, cents };
}

export default function ExpenseFormModal({
  expense,
  contacts,
  defaultDateKey,
  onSave,
  onDelete,
  onClose,
}: ExpenseFormModalProps) {
  const [form, setForm] = useState<FormState>(() => initialState(expense, defaultDateKey));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setSubmitError(null);
    try {
      await action();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong.');
      setBusy(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { errors: nextErrors, cents } = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || cents === null) return;

    run(() =>
      onSave({
        merchant: form.merchant.trim(),
        amount_cents: cents,
        category: form.category,
        expense_date: form.expense_date,
        note: form.note.trim() || null,
        contact_id: form.contact_id || null,
      }),
    );
  }

  return (
    <Modal title={expense ? 'Edit expense' : 'New expense'} busy={busy} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="space-y-5 px-6 py-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="expense-merchant" label="Merchant" error={errors.merchant}>
            <input
              id="expense-merchant"
              value={form.merchant}
              onChange={(e) => update('merchant', e.target.value)}
              placeholder="Sweetgreen"
              className={inputClass}
              aria-invalid={Boolean(errors.merchant)}
            />
          </Field>
          <Field id="expense-amount" label="Amount" error={errors.amount}>
            <input
              id="expense-amount"
              inputMode="decimal"
              value={form.amount}
              onChange={(e) => update('amount', e.target.value)}
              placeholder="24.00"
              className={`${inputClass} tabular-nums`}
              aria-invalid={Boolean(errors.amount)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="expense-date" label="Date" error={errors.expense_date}>
            <input
              id="expense-date"
              type="date"
              value={form.expense_date}
              onChange={(e) => update('expense_date', e.target.value)}
              className={inputClass}
              aria-invalid={Boolean(errors.expense_date)}
            />
          </Field>
          <Field id="expense-category" label="Category">
            <select
              id="expense-category"
              value={form.category}
              onChange={(e) => update('category', e.target.value as ExpenseCategory)}
              className={inputClass}
            >
              {EXPENSE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {EXPENSE_CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field id="expense-contact" label="Linked contact" optional>
          <select
            id="expense-contact"
            value={form.contact_id}
            onChange={(e) => update('contact_id', e.target.value)}
            className={inputClass}
          >
            <option value="">No contact</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name}
                {contact.company ? ` (${contact.company})` : ''}
              </option>
            ))}
          </select>
        </Field>

        <Field id="expense-note" label="Note" optional>
          <input
            id="expense-note"
            value={form.note}
            onChange={(e) => update('note', e.target.value)}
            placeholder="What was it for?"
            className={inputClass}
          />
        </Field>

        {submitError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {submitError}
          </p>
        )}

        <FormActions
          submitLabel={expense ? 'Save changes' : 'Add expense'}
          busy={busy}
          onCancel={onClose}
          onDelete={expense ? () => run(onDelete) : undefined}
        />
      </form>
    </Modal>
  );
}
