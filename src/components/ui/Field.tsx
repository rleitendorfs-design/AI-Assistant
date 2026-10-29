import type { ReactNode } from 'react';

export const inputClass =
  'mt-1.5 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100 aria-[invalid=true]:border-red-600';

interface FieldProps {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  children: ReactNode;
}

export default function Field({ id, label, optional, error, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-neutral-800">
        {label}
        {optional && <span className="font-normal text-neutral-500"> (optional)</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-700">{error}</p>}
    </div>
  );
}
