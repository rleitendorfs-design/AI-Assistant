import { useState, type FormEvent } from 'react';
import Field, { inputClass } from '@/components/ui/Field';
import FormActions from '@/components/ui/FormActions';
import Modal from '@/components/ui/Modal';
import { centsToDollarInput, parseDollarsToCents } from '@/lib/money';
import type { Invoice, InvoiceInput, InvoiceStatus } from '@/types/aide';

interface InvoiceFormModalProps {
  invoice: Invoice | null;
  defaultIssuedKey: string;
  defaultDueKey: string;
  onSave: (input: InvoiceInput) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
}

interface FormState {
  invoice_number: string;
  client_name: string;
  amount: string;
  issued_on: string;
  due_on: string;
  status: InvoiceStatus;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

function initialState(invoice: Invoice | null, defaultIssuedKey: string, defaultDueKey: string): FormState {
  return {
    invoice_number: invoice?.invoice_number ?? '',
    client_name: invoice?.client_name ?? '',
    amount: invoice ? centsToDollarInput(invoice.amount_cents) : '',
    issued_on: invoice?.issued_on ?? defaultIssuedKey,
    due_on: invoice?.due_on ?? defaultDueKey,
    status: invoice?.status ?? 'open',
  };
}

function validate(form: FormState): { errors: FormErrors; cents: number | null } {
  const errors: FormErrors = {};
  const cents = parseDollarsToCents(form.amount);
  if (!form.invoice_number.trim()) errors.invoice_number = 'Enter an invoice number.';
  if (!form.client_name.trim()) errors.client_name = 'Enter who the invoice is for.';
  if (cents === null) errors.amount = 'Enter an amount greater than zero, such as 1200.00.';
  if (!form.issued_on) errors.issued_on = 'Choose an issue date.';
  if (!form.due_on) errors.due_on = 'Choose a due date.';
  else if (form.issued_on && form.due_on < form.issued_on) {
    errors.due_on = 'The due date cannot be before the issue date.';
  }
  return { errors, cents };
}

export default function InvoiceFormModal({
  invoice,
  defaultIssuedKey,
  defaultDueKey,
  onSave,
  onDelete,
  onClose,
}: InvoiceFormModalProps) {
  const [form, setForm] = useState<FormState>(() => initialState(invoice, defaultIssuedKey, defaultDueKey));
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
        invoice_number: form.invoice_number.trim(),
        client_name: form.client_name.trim(),
        amount_cents: cents,
        issued_on: form.issued_on,
        due_on: form.due_on,
        status: form.status,
      }),
    );
  }

  return (
    <Modal title={invoice ? 'Edit invoice' : 'New invoice'} busy={busy} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="space-y-5 px-6 py-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="invoice-number" label="Invoice number" error={errors.invoice_number}>
            <input
              id="invoice-number"
              value={form.invoice_number}
              onChange={(e) => update('invoice_number', e.target.value)}
              placeholder="INV-1043"
              className={inputClass}
              aria-invalid={Boolean(errors.invoice_number)}
            />
          </Field>
          <Field id="invoice-amount" label="Amount" error={errors.amount}>
            <input
              id="invoice-amount"
              inputMode="decimal"
              value={form.amount}
              onChange={(e) => update('amount', e.target.value)}
              placeholder="1200.00"
              className={`${inputClass} tabular-nums`}
              aria-invalid={Boolean(errors.amount)}
            />
          </Field>
        </div>

        <Field id="invoice-client" label="Client or vendor" error={errors.client_name}>
          <input
            id="invoice-client"
            value={form.client_name}
            onChange={(e) => update('client_name', e.target.value)}
            placeholder="Acme Design"
            className={inputClass}
            aria-invalid={Boolean(errors.client_name)}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field id="invoice-issued" label="Issued" error={errors.issued_on}>
            <input
              id="invoice-issued"
              type="date"
              value={form.issued_on}
              onChange={(e) => update('issued_on', e.target.value)}
              className={inputClass}
              aria-invalid={Boolean(errors.issued_on)}
            />
          </Field>
          <Field id="invoice-due" label="Due" error={errors.due_on}>
            <input
              id="invoice-due"
              type="date"
              value={form.due_on}
              onChange={(e) => update('due_on', e.target.value)}
              className={inputClass}
              aria-invalid={Boolean(errors.due_on)}
            />
          </Field>
          <Field id="invoice-status" label="Status">
            <select
              id="invoice-status"
              value={form.status}
              onChange={(e) => update('status', e.target.value as InvoiceStatus)}
              className={inputClass}
            >
              <option value="open">Open</option>
              <option value="paid">Paid</option>
            </select>
          </Field>
        </div>

        {submitError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {submitError}
          </p>
        )}

        <FormActions
          submitLabel={invoice ? 'Save changes' : 'Add invoice'}
          busy={busy}
          onCancel={onClose}
          onDelete={invoice ? () => run(onDelete) : undefined}
        />
      </form>
    </Modal>
  );
}
