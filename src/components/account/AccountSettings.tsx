import { useEffect, useMemo, useState } from 'react';
import { KeyRound, LogOut, Save, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export default function AccountSettings() {
  const { user, signOut } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!user) return;

    const nextName =
      typeof user.user_metadata?.full_name === 'string'
        ? user.user_metadata.full_name
        : typeof user.user_metadata?.name === 'string'
          ? user.user_metadata.name
          : 'Traveler';

    setDisplayName(nextName);
    setEmail(user.email ?? '');
  }, [user]);

  const isDirty = useMemo(() => {
    const originalName = user?.user_metadata?.full_name ?? 'Traveler';
    const originalEmail = user?.email ?? '';

    return (
      displayName.trim().length > 0 &&
      email.trim().length > 0 &&
      (displayName !== originalName ||
        email !== originalEmail ||
        newPassword.length > 0 ||
        confirmPassword.length > 0)
    );
  }, [displayName, email, newPassword, confirmPassword, user]);

  async function handleSave() {
    if (!user) return;

    const trimmedName = displayName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setStatus({ type: 'error', message: 'Please enter a display name.' });
      return;
    }

    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setStatus({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }

    if (newPassword || confirmPassword) {
      if (newPassword.length < MIN_PASSWORD_LENGTH) {
        setStatus({
          type: 'error',
          message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
        });
        return;
      }

      if (newPassword !== confirmPassword) {
        setStatus({ type: 'error', message: 'Passwords do not match.' });
        return;
      }
    }

    setIsSaving(true);
    setStatus(null);

    try {
      const payload: {
        data?: Record<string, string>;
        email?: string;
        password?: string;
      } = {
        data: {
          full_name: trimmedName,
        },
      };

      if (trimmedEmail !== (user.email ?? '')) {
        payload.email = trimmedEmail;
      }

      if (newPassword) {
        payload.password = newPassword;
      }

      const { error } = await supabase.auth.updateUser(payload);

      if (error) {
        throw new Error(error.message);
      }

      setStatus({
        type: 'success',
        message: 'Your account details were saved successfully.',
      });

      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Something went wrong while saving your account.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSignOut() {
    await signOut();
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
              Account
            </p>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
              Manage your profile
            </h1>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:border-neutral-600 dark:hover:bg-neutral-700"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="space-y-5">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/70">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
                    Personal info
                  </p>
                  <p className="text-sm text-neutral-900 dark:text-neutral-200">
                    Update your details below.
                  </p>
                </div>
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Display name
              </span>
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-600 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Email address
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-600 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500"
              />
            </label>
          </div>

          <div className="space-y-5">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/70">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  <KeyRound className="h-4 w-4" aria-hidden="true" />
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
                    Security
                  </p>
                  <p className="text-sm text-neutral-900 dark:text-neutral-200">
                    Update your password securely.
                  </p>
                </div>
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                New password
              </span>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="At least 8 characters"
                className="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-600 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Confirm password
              </span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter new password"
                className="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-600 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500"
              />
            </label>
          </div>
        </div>

        {status && (
          <div
            className={`mt-6 rounded-lg px-4 py-3 text-sm ${
              status.type === 'success'
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-300'
                : 'border border-red-200 bg-red-50 text-red-800 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-300'
            }`}
          >
            {status.message}
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-emerald-600"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {isSaving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

