import { useMemo, useState } from 'react';
import { AlertCircle, Bot, Clock, Loader2, Mail, PenLine, RotateCcw, Zap, type LucideIcon } from 'lucide-react';
import Switch from '@/components/ui/Switch';
import { ACTIVITY_META, formatRelativeTime } from '@/lib/activityMeta';
import { useAsyncList } from '@/hooks/useAsyncList';
import { useSecretarySettings } from '@/hooks/useSecretarySettings';
import { fetchCalendarRules, fetchRecentActivity } from '@/lib/secretaryApi';
import type { ActivityLog, CalendarRule } from '@/types/secretary';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  ready: boolean;
}

function StatCard({ label, value, icon: Icon, ready }: StatCardProps) {
  return (
    <div className="group rounded-2xl border border-neutral-200 bg-white p-5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lifted">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
        <Icon className="h-4 w-4 text-emerald-700 transition-transform duration-200 group-hover:scale-110" strokeWidth={1.75} aria-hidden="true" />
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-neutral-900">{ready ? value : '--'}</p>
    </div>
  );
}

function formatMinutes(total: number) {
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

function summarize(logs: ActivityLog[], rules: CalendarRule[]) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  let emailsToday = 0;
  let drafts = 0;
  let minutesSaved = 0;
  for (const log of logs) {
    if (log.kind === 'email_processed' && new Date(log.created_at) >= startOfToday) emailsToday += 1;
    if (log.kind === 'draft_created') drafts += 1;
    minutesSaved += log.minutes_saved;
  }

  return {
    emailsToday,
    drafts,
    activeAutomations: rules.filter((rule) => rule.enabled).length,
    minutesSaved,
  };
}

const dateFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

export default function DashboardPage() {
  const settings = useSecretarySettings();
  const activity = useAsyncList(fetchRecentActivity);
  const rules = useAsyncList(fetchCalendarRules);
  const [toggling, setToggling] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const stats = useMemo(() => summarize(activity.items, rules.items), [activity.items, rules.items]);
  const ready = activity.loadState === 'ready' && rules.loadState === 'ready';
  const enabled = settings.settings?.secretary_enabled ?? false;

  async function handleToggle(next: boolean) {
    setToggling(true);
    setToggleError(null);
    try {
      await settings.save({ secretary_enabled: next });
    } catch (err) {
      setToggleError(err instanceof Error ? err.message : 'Could not change the secretary status.');
    } finally {
      setToggling(false);
    }
  }

  return (
    <div>
      <div className="animate-fade-up">
        <p className="text-sm font-medium text-neutral-500">{dateFormatter.format(new Date())}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Dashboard</h1>
      </div>

      {settings.loadState === 'error' && (
        <ErrorBanner message={settings.loadError} onRetry={settings.reload} />
      )}

      <section
        aria-label="AI secretary status"
        className="animate-fade-up mt-8 flex flex-col gap-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-soft sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 ${
              enabled ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-600'
            }`}
          >
            <Bot className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <div>
            <p className="text-base font-semibold text-neutral-900">AI Secretary</p>
            <p className="mt-0.5 text-sm text-neutral-500">
              {enabled ? 'Active and handling your inbox.' : 'Paused. New emails are left untouched.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`min-w-[2.5rem] text-sm font-semibold transition-colors duration-200 ${
              enabled ? 'text-emerald-700' : 'text-neutral-500'
            }`}
          >
            {enabled ? 'ON' : 'OFF'}
          </span>
          <Switch
            checked={enabled}
            onChange={handleToggle}
            disabled={toggling || settings.loadState !== 'ready'}
            label={`Turn AI Secretary ${enabled ? 'off' : 'on'}`}
          />
          {toggling && <Loader2 className="h-4 w-4 animate-spin text-neutral-500" aria-hidden="true" />}
        </div>
      </section>

      {toggleError && (
        <p role="alert" className="mt-3 text-sm text-red-800">
          {toggleError}
        </p>
      )}

      <section aria-label="Key figures" className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Emails Processed Today" value={String(stats.emailsToday)} icon={Mail} ready={ready} />
        <StatCard label="Drafts Created" value={String(stats.drafts)} icon={PenLine} ready={ready} />
        <StatCard label="Active Automations" value={String(stats.activeAutomations)} icon={Zap} ready={ready} />
        <StatCard label="Time Saved This Week" value={formatMinutes(stats.minutesSaved)} icon={Clock} ready={ready} />
      </section>

      <section aria-label="Recent activity" className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Recent activity</h2>
          <span className="text-xs text-neutral-500">Last 7 days</span>
        </div>

        {activity.loadState === 'error' && <ErrorBanner message={activity.loadError} onRetry={activity.reload} />}

        {activity.loadState === 'loading' && (
          <div className="flex items-center justify-center gap-3 py-12 text-sm text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Loading activity...
          </div>
        )}

        {activity.loadState === 'ready' && activity.items.length === 0 && (
          <div className="mt-4 rounded-2xl border border-dashed border-neutral-300 px-6 py-12 text-center text-sm text-neutral-500">
            The secretary has not done anything yet this week.
          </div>
        )}

        {activity.loadState === 'ready' && activity.items.length > 0 && (
          <ol className="mt-4 divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-soft">
            {activity.items.map((log) => {
              const meta = ACTIVITY_META[log.kind];
              const Icon = meta.icon;
              return (
                <li key={log.id} className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-emerald-50/50">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900">{log.title}</p>
                    {log.detail && <p className="mt-0.5 text-sm text-neutral-500">{log.detail}</p>}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-neutral-500">{formatRelativeTime(log.created_at)}</p>
                    <p className="mt-1 text-xs font-medium text-emerald-700">{meta.label}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}

function ErrorBanner({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="mt-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>{message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 self-start font-medium text-red-900 underline-offset-4 hover:underline"
      >
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Try again
      </button>
    </div>
  );
}
