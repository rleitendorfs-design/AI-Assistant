import { useState } from 'react';
import { Check, CreditCard, Info, Loader2, Sparkles } from 'lucide-react';

const PREMIUM_FEATURES = [
  'Unlimited email processing',
  'Custom system instructions and tone',
  'Automated drafts for every thread',
  'Advanced calendar rules and scheduling',
  'Priority support',
];

const UPGRADE_DELAY_MS = 700;

export default function BillingPage() {
  const [upgrading, setUpgrading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleUpgrade() {
    setUpgrading(true);
    setNotice(null);
    await new Promise((resolve) => setTimeout(resolve, UPGRADE_DELAY_MS));
    setUpgrading(false);
    setNotice('Online payments are not connected yet. Your plan will change here once checkout is set up.');
  }

  return (
    <div>
      <div className="animate-fade-up">
        <p className="text-sm font-medium text-neutral-500">Plans and payments</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Billing & Subscription</h1>
      </div>

      <section aria-label="Premium plan" className="animate-fade-up mt-10 grid gap-6 md:grid-cols-5">
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-white p-8 shadow-lifted md:col-span-3">
          <span className="absolute right-6 top-6 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            Recommended
          </span>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Premium Plan</p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-5xl font-semibold tracking-tight tabular-nums">$29</span>
            <span className="text-sm text-neutral-500">per month</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            Everything the AI secretary needs to run your inbox, drafts, and calendar.
          </p>

          <ul className="mt-8 space-y-3">
            {PREMIUM_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm text-neutral-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" strokeWidth={2} aria-hidden="true" />
                {feature}
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={handleUpgrade}
            disabled={upgrading}
            className="mt-10 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:bg-emerald-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
          >
            {upgrading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <CreditCard className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            )}
            {upgrading ? 'Preparing checkout...' : 'Upgrade Now'}
          </button>

          {notice && (
            <p role="status" className="mt-4 flex items-start gap-2 rounded-lg bg-neutral-50 px-3 py-2.5 text-sm text-neutral-700 animate-fade-in">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" strokeWidth={1.75} aria-hidden="true" />
              {notice}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-soft md:col-span-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Current plan</p>
          <p className="mt-4 text-2xl font-semibold tracking-tight">Free</p>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            Basic inbox sorting and the activity feed are included. Upgrade to unlock drafts and automation.
          </p>
        </div>
      </section>
    </div>
  );
}
