import { useState, type FormEvent } from 'react';
import Field, { inputClass } from '@/components/ui/Field';
import FormActions from '@/components/ui/FormActions';
import Modal from '@/components/ui/Modal';
import type { Contact, ContactInput } from '@/types/aide';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ContactFormModalProps {
  contact: Contact | null;
  onSave: (input: ContactInput) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
}

interface FormState {
  name: string;
  company: string;
  role: string;
  email: string;
  phone: string;
  notes: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

function initialState(contact: Contact | null): FormState {
  return {
    name: contact?.name ?? '',
    company: contact?.company ?? '',
    role: contact?.role ?? '',
    email: contact?.email ?? '',
    phone: contact?.phone ?? '',
    notes: contact?.notes ?? '',
  };
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = 'Enter a name.';
  if (form.email.trim() && !EMAIL_PATTERN.test(form.email.trim())) {
    errors.email = 'That email address does not look right.';
  }
  return errors;
}

export default function ContactFormModal({ contact, onSave, onDelete, onClose }: ContactFormModalProps) {
  const [form, setForm] = useState<FormState>(() => initialState(contact));
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
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    run(() =>
      onSave({
        name: form.name.trim(),
        company: form.company.trim() || null,
        role: form.role.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        notes: form.notes.trim() || null,
      }),
    );
  }

  return (
    <Modal title={contact ? 'Edit contact' : 'New contact'} busy={busy} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="space-y-5 px-6 py-6">
        <Field id="contact-name" label="Full name" error={errors.name}>
          <input
            id="contact-name"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Sarah Mitchell"
            className={inputClass}
            aria-invalid={Boolean(errors.name)}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="contact-company" label="Company" optional>
            <input
              id="contact-company"
              value={form.company}
              onChange={(e) => update('company', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field id="contact-role" label="Role" optional>
            <input
              id="contact-role"
              value={form.role}
              onChange={(e) => update('role', e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="contact-email" label="Email" optional error={errors.email}>
            <input
              id="contact-email"
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className={inputClass}
              aria-invalid={Boolean(errors.email)}
            />
          </Field>
          <Field id="contact-phone" label="Phone" optional>
            <input
              id="contact-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <Field id="contact-notes" label="Notes" optional>
          <textarea
            id="contact-notes"
            rows={3}
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            placeholder="How you work together, preferences, reminders"
            className={`${inputClass} resize-none`}
          />
        </Field>

        {submitError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {submitError}
          </p>
        )}

        <FormActions
          submitLabel={contact ? 'Save changes' : 'Add contact'}
          busy={busy}
          onCancel={onClose}
          onDelete={contact ? () => run(onDelete) : undefined}
        />
      </form>
    </Modal>
  );
}
