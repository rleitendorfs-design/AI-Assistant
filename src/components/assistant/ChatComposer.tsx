import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { ArrowUp } from 'lucide-react';

interface ChatComposerProps {
  onSend: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function ChatComposer({ onSend, placeholder, disabled = false }: ChatComposerProps) {
  const [draft, setDraft] = useState('');
  const canSend = !disabled && draft.trim().length > 0;

  function submit() {
    if (!canSend) return;
    onSend(draft.trim());
    setDraft('');
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-3 rounded-2xl border border-neutral-300 bg-white p-2 shadow-soft transition-colors focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-100"
    >
      <label htmlFor="trip-prompt" className="sr-only">
        Describe your trip
      </label>
      <textarea
        id="trip-prompt"
        rows={1}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder ?? 'Where do you want to go, and when?'}
        className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={!canSend}
        aria-label="Send message"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm transition-all hover:-translate-y-px hover:bg-emerald-800 hover:shadow-md disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:shadow-none disabled:hover:translate-y-0"
      >
        <ArrowUp className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
      </button>
    </form>
  );
}
