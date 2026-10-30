import { useCallback, useEffect, useMemo, useState } from 'react';
import { deleteMeeting, fetchMeetingsInRange, saveMeeting } from '@/lib/aideApi';
import { addMonths, getMonthGrid, startOfMonth, toDateKey } from '@/lib/dates';
import type { Meeting, MeetingInput } from '@/types/aide';

type LoadState = 'loading' | 'ready' | 'error';

export function useCalendar() {
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [selectedKey, setSelectedKey] = useState(() => toDateKey(new Date()));
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const grid = useMemo(() => getMonthGrid(visibleMonth), [visibleMonth]);
  const rangeFrom = toDateKey(grid[0]);
  const rangeTo = toDateKey(grid[grid.length - 1]);

  useEffect(() => {
    let active = true;
    setLoadState('loading');
    setLoadError(null);

    fetchMeetingsInRange(rangeFrom, rangeTo)
      .then((rows) => {
        if (!active) return;
        setMeetings(rows);
        setLoadState('ready');
      })
      .catch((err: unknown) => {
        if (!active) return;
        setLoadError(err instanceof Error ? err.message : 'Something went wrong.');
        setLoadState('error');
      });

    return () => {
      active = false;
    };
  }, [rangeFrom, rangeTo, version]);

  const meetingsByDay = useMemo(() => {
    const map = new Map<string, Meeting[]>();
    for (const meeting of meetings) {
      const list = map.get(meeting.meeting_date) ?? [];
      list.push(meeting);
      map.set(meeting.meeting_date, list);
    }
    return map;
  }, [meetings]);

  const goToMonth = useCallback((offset: number) => {
    setVisibleMonth((current) => addMonths(current, offset));
  }, []);

  const goToToday = useCallback(() => {
    const today = new Date();
    setVisibleMonth(startOfMonth(today));
    setSelectedKey(toDateKey(today));
  }, []);

  const save = useCallback(async (input: MeetingInput, id: string | null) => {
    await saveMeeting(input, id);
    setVersion((value) => value + 1);
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteMeeting(id);
    setVersion((value) => value + 1);
  }, []);

  return {
    grid,
    visibleMonth,
    selectedKey,
    setSelectedKey,
    meetingsByDay,
    loadState,
    loadError,
    reload: () => setVersion((value) => value + 1),
    goToMonth,
    goToToday,
    save,
    remove,
  };
}
