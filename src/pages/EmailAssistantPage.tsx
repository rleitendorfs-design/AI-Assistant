import { useState, type FormEvent } from 'react';
import { CheckCircle2, Link2, Link2Off, Loader2, Mail, Save } from 'lucide-react';
import { ACTIVITY_META, formatRelativeTime } from '@/lib/activityMeta';
import { useAsyncList } from '@/hooks/useAsyncList';
import { useAuth } from '@/hooks/useAuth';
import { useSecretarySettings } from '@/hooks/useSecretarySettings';
import { fetchRecentActivity } from '@/lib/secretaryApi';
import type { SecretarySettings } from '@/types/secretary';

const MAX_INSTRUCTIONS_LENGTH = 2000;
const SIMULATED_CONNECT_DELAY_MS = 900;
const SAVED_FLASH_MS = 2000;

type SettingsHook = ReturnType<typeof useSecretarySettings>;

export default function EmailAssistantPage() {
  const settings = useSecretarySettings();
  const activity = useAsyncList(fetchRecentActivity);
  const emailLog = activity.items.filter((log) => log.kind === 'email_processed' || log.kind === 'draft_created');

  return (
    <div>
      <div className="animate-fade-up">
        <p className="text-sm font-medium text-neutral-500">Settings and logs</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Email Assistant</h1>
      </div>

      {settings.loadState === 'error' && (
        <div role="alert" className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p>{settings.loadError}</p>
          <button type="button" onClick={settings.reload} className="mt-2 font-medium underline-offset-4 hover:underline">
            Try again
          </button>
        </div>
      )}

      {settings.loadState === 'loading' && (
        <p className="mt-10 text-sm text-neutral-500">Loading your assistant...</p>
      )}

      {settings.settings && (
        <>
          <GmailConnectionCard settings={settings.settings} onSave={settings.save} />
          <InstructionsEditor
            initial={settings.settings.system_instructions}
            onSave={async (text) => {
              await settings.save({ system_instructions: text });
            }}
          />
        </>
      )}

      <section aria-label="Email log" className="mt-10">
        <h2 className="text-lg font-semibold">Email log</h2>
        <p className="mt-1 text-sm text-neutral-500">What the secretary has read and drafted recently.</p>

        {activity.loadState === 'error' && (
          <p role="alert" className="mt-4 text-sm text-red-800">
            {activity.loadError}
          </p>
        )}

        {activity.loadState === 'ready' && emailLog.length === 0 && (
          <div className="mt-5 rounded-2xl border border-dashed border-neutral-300 px-6 py-10 text-center text-sm text-neutral-500">
            No emails have been processed yet.
          </div>
        )}

        {emailLog.length > 0 && (
          <ul className="mt-5 divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-soft">
            {emailLog.map((log) => {
              const Icon = ACTIVITY_META[log.kind].icon;
              return (
                <li key={log.id} className="flex items-start gap-4 px-5 py-4">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" strokeWidth={1.75} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900">{log.title}</p>
                    {log.detail && <p className="mt-0.5 text-sm text-neutral-500">{log.detail}</p>}
                  </div>
                  <p className="shrink-0 text-xs text-neutral-500">{formatRelativeTime(log.created_at)}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

interface GmailConnectionCardProps {
  settings: SecretarySettings;
  onSave: SettingsHook['save'];
}

function GmailConnectionCard({ settings, onSave }: GmailConnectionCardProps) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connect() {
    setBusy(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, SIMULATED_CONNECT_DELAY_MS));
      await onSave({ gmail_connected: true, gmail_address: user?.email ?? null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not connect Gmail.');
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    setError(null);
    try {
      await onSave({ gmail_connected: false, gmail_address: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not disconnect Gmail.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Gmail connection" className="animate-fade-up mt-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-soft">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Mail className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <div>
            <p className="text-base font-semibold text-neutral-900">Gmail</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-neutral-500">
              {settings.gmail_connected ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                  Connected as {settings.gmail_address}
                </>
              ) : (
                'Not connected. The secretary cannot read your inbox yet.'
              )}
            </p>
          </div>
        </div>

        {settings.gmail_connected ? (
          <button
            type="button"
            onClick={disconnect}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-800 transition-colors hover:border-red-400 hover:text-red-700 disabled:opacity-60"
          >
            <Link2Off className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            {busy ? 'Disconnecting...' : 'Disconnect'}
          </button>
        ) : (
          <button
            type="button"
            onClick={connect}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:bg-emerald-800 hover:shadow-md disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Link2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />}
            {busy ? 'Connecting...' : 'Connect Gmail Account'}
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-800">
          {error}
        </p>
      )}
    </section>
  );
}

interface InstructionsEditorProps {
  initial: string;
  onSave: (text: string) => Promise<void>;
}

function InstructionsEditor({ initial, onSave }: InstructionsEditorProps) {
  const [text, setText] = useState(initial);
  const [baseline, setBaseline] = useState(initial.trim());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = text.trim();
  const dirty = trimmed !== baseline;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dirty || saving) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await onSave(trimmed);
      setBaseline(trimmed);
      setSaved(true);
      window.setTimeout(() => setSaved(false), SAVED_FLASH_MS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your instructions.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-label="Custom system instructions" className="animate-fade-up mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-soft">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="system-instructions" className="text-base font-semibold text-neutral-900">
            Custom system instructions
          </label>
          <p className="mt-1 text-sm text-neutral-500">
            Tell the secretary how to write and what to offer. For example: be polite, sign off as Executive Assistant, and
            offer Tuesday afternoons for meetings.
          </p>
        </div>

        <textarea
          id="system-instructions"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_INSTRUCTIONS_LENGTH))}
          rows={6}
          placeholder="Be polite, sign off as Executive Assistant, offer Tuesday afternoons for meetings."
          className="w-full resize-y rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm leading-relaxed text-neutral-900 shadow-sm transition-colors placeholder:text-neutral-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-neutral-500 tabular-nums">
            {text.length} / {MAX_INSTRUCTIONS_LENGTH}
          </p>
          <div className="flex items-center gap-3">
            {saved && (
              <span role="status" className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 animate-fade-in">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Saved
              </span>
            )}
            <button
              type="submit"
              disabled={!dirty || saving}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />}
              {saving ? 'Saving...' : 'Save Configurations'}
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-800">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}
