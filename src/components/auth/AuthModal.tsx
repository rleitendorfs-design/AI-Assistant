import { useState, type FormEvent } from 'react';
import Field, { inputClass } from '@/components/ui/Field';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import type { AuthMode } from '@/contexts/AuthContext';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

interface AuthModalProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onClose: () => void;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirm?: string;
}

export default function AuthModal({ mode, onModeChange, onClose }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const isSignUp = mode === 'sign-up';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function switchMode(next: AuthMode) {
    setErrors({});
    setSubmitError(null);
    onModeChange(next);
  }

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (!EMAIL_PATTERN.test(email.trim())) next.email = 'Enter a valid email address.';
    if (isSignUp && password.length < MIN_PASSWORD_LENGTH) {
      next.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    } else if (!isSignUp && !password) {
      next.password = 'Enter your password.';
    }
    if (isSignUp && confirm !== password) next.confirm = 'The passwords do not match.';
    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setBusy(true);
    setSubmitError(null);
    try {
      if (isSignUp) await signUp(email.trim(), password);
      else await signIn(email.trim(), password);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setBusy(false);
    }
  }

  return (
    <Modal title={isSignUp ? 'Create your account' : 'Welcome back'} busy={busy} onClose={onClose}>
      <div className="px-6 pt-5">
        <div role="tablist" aria-label="Account" className="grid grid-cols-2 rounded-lg bg-neutral-100 p-1">
          {(['sign-in', 'sign-up'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={mode === tab}
              onClick={() => switchMode(tab)}
              disabled={busy}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
                mode === tab ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {tab === 'sign-in' ? 'Log in' : 'Create account'}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5 px-6 py-6">
        <Field id="auth-email" label="Email" error={errors.email}>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className={inputClass}
            aria-invalid={Boolean(errors.email)}
          />
        </Field>

        <Field id="auth-password" label="Password" error={errors.password}>
          <input
            id="auth-password"
            type="password"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isSignUp ? `At least ${MIN_PASSWORD_LENGTH} characters` : ''}
            className={inputClass}
            aria-invalid={Boolean(errors.password)}
          />
        </Field>

        {isSignUp && (
          <Field id="auth-confirm" label="Confirm password" error={errors.confirm}>
            <input
              id="auth-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputClass}
              aria-invalid={Boolean(errors.confirm)}
            />
          </Field>
        )}

        {submitError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'Please wait...' : isSignUp ? 'Create account' : 'Log in'}
        </button>
      </form>
    </Modal>
  );
}
