import { useState, type FormEvent } from 'react';
import Field, { inputClass } from '@/components/ui/Field';
import FormActions from '@/components/ui/FormActions';
import Modal from '@/components/ui/Modal';
import { centsToDollarInput, parseDollarsToCents } from '@/lib/money';
import {
  BOOKING_KINDS,
  BOOKING_STATUSES,
  type Booking,
  type BookingInput,
  type BookingKind,
  type BookingStatus,
} from '@/types/aide';

const KIND_LABELS: Record<BookingKind, string> = {
  flight: 'Flight',
  stay: 'Stay',
  other: 'Other',
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  planned: 'Planned',
  booked: 'Booked',
  cancelled: 'Cancelled',
};

interface BookingFormModalProps {
  booking: Booking | null;
  onSave: (input: BookingInput) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
}

interface FormState {
  kind: BookingKind;
  title: string;
  provider: string;
  confirmation_code: string;
  location: string;
  starts_on: string;
  ends_on: string;
  amount: string;
  status: BookingStatus;
  notes: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

function initialState(booking: Booking | null): FormState {
  return {
    kind: booking?.kind ?? 'flight',
    title: booking?.title ?? '',
    provider: booking?.provider ?? '',
    confirmation_code: booking?.confirmation_code ?? '',
    location: booking?.location ?? '',
    starts_on: booking?.starts_on ?? '',
    ends_on: booking?.ends_on ?? '',
    amount: booking?.amount_cents != null ? centsToDollarInput(booking.amount_cents) : '',
    status: booking?.status ?? 'planned',
    notes: booking?.notes ?? '',
  };
}

function validate(form: FormState): { errors: FormErrors; amountCents: number | null } {
  const errors: FormErrors = {};
  const trimmedAmount = form.amount.trim();
  const amountCents = trimmedAmount ? parseDollarsToCents(trimmedAmount) : null;

  if (!form.title.trim()) errors.title = 'Enter a name for this booking.';
  if (!form.starts_on) errors.starts_on = 'Choose a start date.';
  if (form.starts_on && form.ends_on && form.ends_on < form.starts_on) {
    errors.ends_on = 'The end date cannot be before the start date.';
  }
  if (trimmedAmount && amountCents === null) {
    errors.amount = 'Enter an amount such as 240.00, or leave it empty.';
  }
  return { errors, amountCents };
}

export default function BookingFormModal({ booking, onSave, onDelete, onClose }: BookingFormModalProps) {
  const [form, setForm] = useState<FormState>(() => initialState(booking));
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
    const { errors: nextErrors, amountCents } = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    run(() =>
      onSave({
        kind: form.kind,
        title: form.title.trim(),
        provider: form.provider.trim() || null,
        confirmation_code: form.confirmation_code.trim() || null,
        location: form.location.trim() || null,
        starts_on: form.starts_on,
        ends_on: form.ends_on || null,
        amount_cents: amountCents,
        status: form.status,
        notes: form.notes.trim() || null,
      }),
    );
  }

  return (
    <Modal title={booking ? 'Edit booking' : 'New booking'} busy={busy} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="space-y-5 px-6 py-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="booking-kind" label="Type">
            <select
              id="booking-kind"
              value={form.kind}
              onChange={(e) => update('kind', e.target.value as BookingKind)}
              className={inputClass}
            >
              {BOOKING_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {KIND_LABELS[kind]}
                </option>
              ))}
            </select>
          </Field>
          <Field id="booking-status" label="Status">
            <select
              id="booking-status"
              value={form.status}
              onChange={(e) => update('status', e.target.value as BookingStatus)}
              className={inputClass}
            >
              {BOOKING_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field id="booking-title" label="Name" error={errors.title}>
          <input
            id="booking-title"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="Flight to Lisbon"
            className={inputClass}
            aria-invalid={Boolean(errors.title)}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="booking-provider" label="Booked through" optional>
            <input
              id="booking-provider"
              value={form.provider}
              onChange={(e) => update('provider', e.target.value)}
              placeholder="Skyscanner, Booking.com, airline"
              className={inputClass}
            />
          </Field>
          <Field id="booking-code" label="Confirmation code" optional>
            <input
              id="booking-code"
              value={form.confirmation_code}
              onChange={(e) => update('confirmation_code', e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <Field id="booking-location" label="Location" optional>
          <input
            id="booking-location"
            value={form.location}
            onChange={(e) => update('location', e.target.value)}
            placeholder="Lisbon, Portugal"
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field id="booking-start" label="Starts" error={errors.starts_on}>
            <input
              id="booking-start"
              type="date"
              value={form.starts_on}
              onChange={(e) => update('starts_on', e.target.value)}
              className={inputClass}
              aria-invalid={Boolean(errors.starts_on)}
            />
          </Field>
          <Field id="booking-end" label="Ends" optional error={errors.ends_on}>
            <input
              id="booking-end"
              type="date"
              value={form.ends_on}
              onChange={(e) => update('ends_on', e.target.value)}
              className={inputClass}
              aria-invalid={Boolean(errors.ends_on)}
            />
          </Field>
          <Field id="booking-amount" label="Total paid" optional error={errors.amount}>
            <input
              id="booking-amount"
              inputMode="decimal"
              value={form.amount}
              onChange={(e) => update('amount', e.target.value)}
              placeholder="240.00"
              className={`${inputClass} tabular-nums`}
              aria-invalid={Boolean(errors.amount)}
            />
          </Field>
        </div>

        <Field id="booking-notes" label="Notes" optional>
          <textarea
            id="booking-notes"
            rows={3}
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            placeholder="Check-in time, seat preference, reminders"
            className={`${inputClass} resize-none`}
          />
        </Field>

        {submitError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {submitError}
          </p>
        )}

        <FormActions
          submitLabel={booking ? 'Save changes' : 'Add booking'}
          busy={busy}
          onCancel={onClose}
          onDelete={booking ? () => run(onDelete) : undefined}
        />
      </form>
    </Modal>
  );
}
