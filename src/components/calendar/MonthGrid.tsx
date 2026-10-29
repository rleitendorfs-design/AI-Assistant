import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Meeting } from '@/types/aide';
import { toDateKey } from '@/lib/dates';

const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
const dayLabelFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface MonthGridProps {
  grid: Date[];
  visibleMonth: Date;
  selectedKey: string;
  meetingsByDay: Map<string, Meeting[]>;
  onSelect: (dateKey: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export default function MonthGrid({
  grid,
  visibleMonth,
  selectedKey,
  meetingsByDay,
  onSelect,
  onPrev,
  onNext,
  onToday,
}: MonthGridProps) {
  const todayKey = toDateKey(new Date());
  const monthIndex = visibleMonth.getMonth();

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-soft sm:p-6">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-neutral-900">
          {monthFormatter.format(visibleMonth)}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToday}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-800 transition-colors hover:border-emerald-600 hover:text-emerald-800"
          >
            Today
          </button>
          <button
            type="button"
            onClick={onPrev}
            aria-label="Previous month"
            className="rounded-lg p-1.5 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label="Next month"
            className="rounded-lg p-1.5 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="mt-6 grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((day) => (
          <div key={day} className="pb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
            {day}
          </div>
        ))}

        {grid.map((date) => {
          const key = toDateKey(date);
          const dayMeetings = meetingsByDay.get(key) ?? [];
          const inMonth = date.getMonth() === monthIndex;
          const isSelected = key === selectedKey;
          const isToday = key === todayKey;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              aria-label={`${dayLabelFormatter.format(date)}, ${dayMeetings.length} meetings`}
              aria-pressed={isSelected}
              className={`group relative mx-auto flex h-11 w-11 flex-col items-center justify-center rounded-xl text-sm font-medium tabular-nums transition-colors sm:h-12 sm:w-12 ${
                isSelected
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : inMonth
                    ? 'text-neutral-900 hover:bg-emerald-50 hover:text-emerald-800'
                    : 'text-neutral-400 hover:bg-neutral-50'
              }`}
            >
              <span
                className={
                  isToday && !isSelected
                    ? 'flex h-7 w-7 items-center justify-center rounded-full ring-1 ring-emerald-600 text-emerald-800'
                    : ''
                }
              >
                {date.getDate()}
              </span>
              {dayMeetings.length > 0 && (
                <span className="mt-0.5 flex gap-0.5" aria-hidden="true">
                  {dayMeetings.slice(0, 3).map((meeting) => (
                    <span
                      key={meeting.id}
                      className={`h-1 w-1 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-600'}`}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
