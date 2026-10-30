import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface FormActionsProps {
  submitLabel: string;
  busy: boolean;
  onCancel: () => void;
  onDelete?: () => void;
}

export default function FormActions({ submitLabel, busy, onCancel, onDelete }: FormActionsProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
      {onDelete ? (
        confirmingDelete ? (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-neutral-600">Delete this entry?</span>
            <button
              type="button"
              onClick={onDelete}
              disabled={busy}
              className="rounded-md bg-red-700 px-3 py-1.5 font-medium text-white transition-colors hover:bg-red-800 disabled:opacity-60"
            >
              Yes, delete
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              disabled={busy}
              className="rounded-md px-3 py-1.5 font-medium text-neutral-600 hover:text-neutral-900"
            >
              Keep
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            disabled={busy}
            className="self-start text-sm font-medium text-red-700 transition-colors hover:text-red-900 disabled:opacity-50"
          >
            Delete
          </button>
        )
      ) : (
        <span />
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex min-w-[120px] items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
