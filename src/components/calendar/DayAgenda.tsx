import { CalendarPlus, MapPin } from 'lucide-react';
import type { Meeting } from '@/types/aide';
import { formatTimeLabel, parseDateKey } from '@/lib/dates';

const dayFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

interface DayAgendaProps {
  dateKey: string;
  meetings: Meeting[];
  onAdd: () => void;
  onOpen: (meeting: Meeting) => void;
}

export default function DayAgenda({ dateKey, meetings, onAdd, onOpen }: DayAgendaProps) {
  const label = dayFormatter.format(parseDateKey(dateKey));

  return (
    <section className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-soft sm:p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            {meetings.length === 1 ? '1 meeting' : `${meetings.length} meetings`}
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-neutral-900">{label}</h2>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-emerald-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:bg-emerald-800 hover:shadow-md"
        >
          <CalendarPlus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          Add
        </button>
      </header>

      {meetings.length === 0 ? (
        <div className="mt-8 flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 px-6 py-10 text-center">
          <p className="text-sm font-medium text-neutral-800">Nothing scheduled</p>
          <p className="mt-1 text-sm text-neutral-500">Add a meeting to fill this day.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {meetings.map((meeting) => (
            <li key={meeting.id}>
              <button
                type="button"
                onClick={() => onOpen(meeting)}
                className="group flex w-full items-start gap-4 rounded-xl border border-neutral-200 bg-white p-4 text-left transition-all hover:-translate-y-px hover:border-emerald-200 hover:shadow-soft"
              >
                <div className="w-20 shrink-0 pt-0.5">
                  <p className="text-sm font-semibold tabular-nums text-neutral-900">
                    {formatTimeLabel(meeting.start_time)}
                  </p>
                  {meeting.end_time && (
                    <p className="mt-0.5 text-xs tabular-nums text-neutral-500">
                      to {formatTimeLabel(meeting.end_time)}
                    </p>
                  )}
                </div>
                <div className="min-w-0 flex-1 border-l-2 border-emerald-600 pl-4">
                  <p className="truncate text-sm font-semibold text-neutral-900">{meeting.title}</p>
                  {meeting.location && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
                      <MapPin className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                      <span className="truncate">{meeting.location}</span>
                    </p>
                  )}
                  {meeting.notes && (
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-neutral-600">
                      {meeting.notes}
                    </p>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
