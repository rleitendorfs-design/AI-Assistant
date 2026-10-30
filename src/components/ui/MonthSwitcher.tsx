import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthSwitcherProps {
  label: string;
  onPrev: () => void;
  onNext: () => void;
}

export default function MonthSwitcher({ label, onPrev, onNext }: MonthSwitcherProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 bg-white p-1 shadow-soft">
      <button
        type="button"
        onClick={onPrev}
        aria-label="Previous month"
        className="rounded-lg p-1.5 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>
      <span className="min-w-[10rem] text-center text-sm font-semibold text-neutral-900">{label}</span>
      <button
        type="button"
        onClick={onNext}
        aria-label="Next month"
        className="rounded-lg p-1.5 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
