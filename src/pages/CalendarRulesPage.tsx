import { useState, type FormEvent } from 'react';
import { CalendarClock, Loader2, Plus, Trash2 } from 'lucide-react';
import Switch from '@/components/ui/Switch';
import { useAsyncList } from '@/hooks/useAsyncList';
import { createCalendarRule, deleteCalendarRule, fetchCalendarRules, setCalendarRuleEnabled } from '@/lib/secretaryApi';

const NAME_MAX_LENGTH = 80;
const DESCRIPTION_MAX_LENGTH = 240;

export default function CalendarRulesPage() {
  const rules = useAsyncList(fetchCalendarRules);
  const [adding, setAdding] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function runAction(id: string, action: () => Promise<void>) {
    setPendingId(id);
    setActionError(null);
    try {
      await action();
      rules.reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setPendingId(null);
      setConfirmDeleteId(null);
    }
  }

  const activeCount = rules.items.filter((rule) => rule.enabled).length;

  return (
    <div>
      <div className="animate-fade-up flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">How the secretary schedules</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Calendar Rules</h1>
        </div>
        <button
          type="button"
          onClick={() => setAdding((open) => !open)}
          aria-expanded={adding}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:bg-emerald-800 hover:shadow-md"
        >
          <Plus className={`h-4 w-4 transition-transform duration-200 ${adding ? 'rotate-45' : ''}`} strokeWidth={2} aria-hidden="true" />
          {adding ? 'Close' : 'Add rule'}
        </button>
      </div>

      {adding && (
        <NewRuleForm
          onCreated={() => {
            setAdding(false);
            rules.reload();
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      {actionError && (
        <p role="alert" className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {actionError}
        </p>
      )}

      {rules.loadState === 'error' && (
        <div role="alert" className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p>{rules.loadError}</p>
          <button type="button" onClick={rules.reload} className="mt-2 font-medium underline-offset-4 hover:underline">
            Try again
          </button>
        </div>
      )}

      {rules.loadState === 'loading' && <p className="mt-10 text-sm text-neutral-500">Loading your rules...</p>}

      {rules.loadState === 'ready' && rules.items.length === 0 && (
        <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-neutral-300 px-6 py-14 text-center">
          <CalendarClock className="h-7 w-7 text-emerald-700" strokeWidth={1.75} aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-neutral-800">No calendar rules yet</p>
          <p className="mt-1 text-sm text-neutral-500">Add a rule to tell the secretary how to handle meeting requests.</p>
        </div>
      )}

      {rules.loadState === 'ready' && rules.items.length > 0 && (
        <>
          <p className="mt-8 text-sm text-neutral-500">
            {activeCount} of {rules.items.length} rules active
          </p>
          <ul className="mt-3 divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-soft">
            {rules.items.map((rule) => {
              const busy = pendingId === rule.id;
              const confirming = confirmDeleteId === rule.id;
              return (
                <li key={rule.id} className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-emerald-50/40">
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold ${rule.enabled ? 'text-neutral-900' : 'text-neutral-500'}`}>
                      {rule.name}
                    </p>
                    {rule.description && <p className="mt-1 text-sm text-neutral-500">{rule.description}</p>}
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    {confirming ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={busy}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100"
                        >
                          Keep
                        </button>
                        <button
                          type="button"
                          onClick={() => runAction(rule.id, () => deleteCalendarRule(rule.id))}
                          disabled={busy}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                        >
                          {busy ? 'Removing...' : 'Confirm remove'}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(rule.id)}
                          disabled={busy}
                          aria-label={`Remove rule ${rule.name}`}
                          className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                        </button>
                        {busy && <Loader2 className="h-4 w-4 animate-spin text-neutral-500" aria-hidden="true" />}
                        <Switch
                          checked={rule.enabled}
                          disabled={busy}
                          label={`${rule.enabled ? 'Disable' : 'Enable'} rule ${rule.name}`}
                          onChange={(next) => runAction(rule.id, () => setCalendarRuleEnabled(rule.id, next))}
                        />
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

interface NewRuleFormProps {
  onCreated: () => void;
  onCancel: () => void;
}

function NewRuleForm({ onCreated, onCancel }: NewRuleFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Give the rule a name.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createCalendarRule(trimmedName, description.trim());
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create this rule.');
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="animate-fade-up mt-6 space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-soft"
    >
      <div>
        <label htmlFor="rule-name" className="block text-sm font-medium text-neutral-800">
          Rule name
        </label>
        <input
          id="rule-name"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, NAME_MAX_LENGTH))}
          placeholder="Offer Tuesday afternoons"
          className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
        />
      </div>
      <div>
        <label htmlFor="rule-description" className="block text-sm font-medium text-neutral-800">
          What should happen
        </label>
        <textarea
          id="rule-description"
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, DESCRIPTION_MAX_LENGTH))}
          rows={3}
          placeholder="Suggest Tuesday between 1:00 and 5:00 PM for new meeting requests."
          className="mt-2 w-full resize-y rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-800">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-800 disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {saving ? 'Saving...' : 'Save rule'}
        </button>
      </div>
    </form>
  );
}
