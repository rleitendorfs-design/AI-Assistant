import { useState } from 'react';
import { AlertCircle, Loader2, RotateCcw } from 'lucide-react';
import DayAgenda from '@/components/calendar/DayAgenda';
import MeetingFormModal from '@/components/calendar/MeetingFormModal';
import MonthGrid from '@/components/calendar/MonthGrid';
import { useCalendar } from '@/hooks/useCalendar';
import type { Meeting } from '@/types/aide';

type Editor = { meeting: Meeting | null } | null;

export default function CalendarPage() {
  const {
    grid,
    visibleMonth,
    selectedKey,
    setSelectedKey,
    meetingsByDay,
    loadState,
    loadError,
    reload,
    goToMonth,
    goToToday,
    save,
    remove,
  } = useCalendar();

  const [editor, setEditor] = useState<Editor>(null);
  const dayMeetings = meetingsByDay.get(selectedKey) ?? [];

  return (
    <div>

      <main className="mx-auto max-w-5xl px-6 pb-20 pt-10 md:px-10 md:pt-14">
        <div className="animate-fade-up">
          <p className="text-sm font-medium text-neutral-500">Your schedule</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Calendar</h1>
        </div>

        {loadState === 'error' && (
          <div
            role="alert"
            className="mt-8 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>{loadError}</p>
            </div>
            <button
              type="button"
              onClick={reload}
              className="inline-flex items-center gap-2 self-start rounded-md px-2 py-1 font-medium text-red-900 underline-offset-4 hover:underline sm:self-auto"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Try again
            </button>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_1fr]">
          <MonthGrid
            grid={grid}
            visibleMonth={visibleMonth}
            selectedKey={selectedKey}
            meetingsByDay={meetingsByDay}
            onSelect={setSelectedKey}
            onPrev={() => goToMonth(-1)}
            onNext={() => goToMonth(1)}
            onToday={goToToday}
          />

          <div className="relative">
            {loadState === 'loading' && (
              <div className="absolute right-5 top-5 z-10 flex items-center gap-2 text-xs text-neutral-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                Updating
              </div>
            )}
            <DayAgenda
              dateKey={selectedKey}
              meetings={dayMeetings}
              onAdd={() => setEditor({ meeting: null })}
              onOpen={(meeting) => setEditor({ meeting })}
            />
          </div>
        </div>
      </main>

      {editor && (
        <MeetingFormModal
          key={editor.meeting?.id ?? 'new'}
          meeting={editor.meeting}
          defaultDateKey={selectedKey}
          onClose={() => setEditor(null)}
          onSave={async (input) => {
            await save(input, editor.meeting?.id ?? null);
            setEditor(null);
          }}
          onDelete={async () => {
            if (!editor.meeting) return;
            await remove(editor.meeting.id);
            setEditor(null);
          }}
        />
      )}
    </div>
  );
}
