import { useState, type FormEvent } from 'react';
import Field, { inputClass } from '@/components/ui/Field';
import FormActions from '@/components/ui/FormActions';
import Modal from '@/components/ui/Modal';
import type { Meeting, MeetingInput } from '@/types/aide';

const TITLE_MAX_LENGTH = 120;

interface MeetingFormModalProps {
  meeting: Meeting | null;
  defaultDateKey: string;
  onSave: (input: MeetingInput) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
}

interface FormState {
  title: string;
  meeting_date: string;
  start_time: string;
  end_time: string;
  location: string;
  notes: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

function initialState(meeting: Meeting | null, defaultDateKey: string): FormState {
  return {
    title: meeting?.title ?? '',
    meeting_date: meeting?.meeting_date ?? defaultDateKey,
    start_time: meeting?.start_time.slice(0, 5) ?? '09:00',
    end_time: meeting?.end_time?.slice(0, 5) ?? '',
    location: meeting?.location ?? '',
    notes: meeting?.notes ?? '',
  };
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.title.trim()) errors.title = 'Give the meeting a name.';
  else if (form.title.trim().length > TITLE_MAX_LENGTH) {
    errors.title = `Keep the name under ${TITLE_MAX_LENGTH} characters.`;
  }
  if (!form.meeting_date) errors.meeting_date = 'Choose a date.';
  if (!form.start_time) errors.start_time = 'Choose a start time.';
  if (form.end_time && form.start_time && form.end_time <= form.start_time) {
    errors.end_time = 'The end time must be after the start time.';
  }
  return errors;
}

export default function MeetingFormModal({
  meeting,
  defaultDateKey,
  onSave,
  onDelete,
  onClose,
}: MeetingFormModalProps) {
  const [form, setForm] = useState<FormState>(() => initialState(meeting, defaultDateKey));
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
        title: form.title.trim(),
        meeting_date: form.meeting_date,
        start_time: form.start_time,
        end_time: form.end_time || null,
        location: form.location.trim() || null,
        notes: form.notes.trim() || null,
      }),
    );
  }

  return (
    <Modal title={meeting ? 'Edit meeting' : 'New meeting'} busy={busy} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="space-y-5 px-6 py-6">
        <Field id="meeting-title" label="Title" error={errors.title}>
          <input
            id="meeting-title"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="Weekly team sync"
            className={inputClass}
            aria-invalid={Boolean(errors.title)}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field id="meeting-date" label="Date" error={errors.meeting_date}>
            <input
              id="meeting-date"
              type="date"
              value={form.meeting_date}
              onChange={(e) => update('meeting_date', e.target.value)}
              className={inputClass}
              aria-invalid={Boolean(errors.meeting_date)}
            />
          </Field>
          <Field id="meeting-start" label="Starts" error={errors.start_time}>
            <input
              id="meeting-start"
              type="time"
              value={form.start_time}
              onChange={(e) => update('start_time', e.target.value)}
              className={inputClass}
              aria-invalid={Boolean(errors.start_time)}
            />
          </Field>
          <Field id="meeting-end" label="Ends" optional error={errors.end_time}>
            <input
              id="meeting-end"
              type="time"
              value={form.end_time}
              onChange={(e) => update('end_time', e.target.value)}
              className={inputClass}
              aria-invalid={Boolean(errors.end_time)}
            />
          </Field>
        </div>

        <Field id="meeting-location" label="Location" optional>
          <input
            id="meeting-location"
            value={form.location}
            onChange={(e) => update('location', e.target.value)}
            placeholder="Room 4B or video link"
            className={inputClass}
          />
        </Field>

        <Field id="meeting-notes" label="Notes" optional>
          <textarea
            id="meeting-notes"
            rows={3}
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            placeholder="Agenda, prep, or who is attending"
            className={`${inputClass} resize-none`}
          />
        </Field>

        {submitError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {submitError}
          </p>
        )}

        <FormActions
          submitLabel={meeting ? 'Save changes' : 'Add meeting'}
          busy={busy}
          onCancel={onClose}
          onDelete={meeting ? () => run(onDelete) : undefined}
        />
      </form>
    </Modal>
  );
}
