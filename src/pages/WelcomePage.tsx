import { CalendarDays, Feather, Receipt, ShieldCheck, Users, Wallet } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const FEATURES = [
  { icon: CalendarDays, title: 'Calendar', text: 'Meetings and reminders for every day, in one place.' },
  { icon: Receipt, title: 'Expenses', text: 'Log receipts and see where the money goes each month.' },
  { icon: Users, title: 'Contacts', text: 'The people you work with, with their details at hand.' },
  { icon: Wallet, title: 'Accounting', text: 'Track invoices and what is owed to you.' },
];

export default function WelcomePage() {
  const { openAuth } = useAuth();

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 pt-6 md:px-10">
        <div className="flex items-center gap-2">
          <Feather className="h-5 w-5 text-emerald-700" strokeWidth={2} aria-hidden="true" />
          <span className="text-lg font-semibold tracking-tight">Aide</span>
        </div>
        <button
          type="button"
          onClick={() => openAuth('sign-in')}
          className="inline-flex items-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-800 hover:shadow-md"
        >
          Log in
        </button>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24 pt-16 md:px-10 md:pt-24">
        <div className="animate-fade-up max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            Your private workspace
          </p>
          <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight md:text-6xl">
            Your day, handled.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-neutral-600">
            Aide keeps your schedule, spending, contacts, and invoices together, so you can spend less time on
            admin and more on the work that matters.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => openAuth('sign-up')}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:bg-emerald-800 hover:shadow-md"
            >
              Create your account
            </button>
            <button
              type="button"
              onClick={() => openAuth('sign-in')}
              className="inline-flex items-center justify-center rounded-lg border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-800 transition-colors hover:border-emerald-600 hover:text-emerald-800"
            >
              Log in
            </button>
          </div>
        </div>

        <ul className="mt-20 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-soft">
              <Icon className="h-5 w-5 text-emerald-700" strokeWidth={1.75} aria-hidden="true" />
              <h2 className="mt-4 text-base font-semibold text-neutral-900">{title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-neutral-600">{text}</p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
