import { Clock, Mail, PenLine, Zap, CalendarClock, type LucideIcon } from 'lucide-react';
import type { ActivityKind } from '@/types/secretary';

export const ACTIVITY_META: Record<ActivityKind, { icon: LucideIcon; label: string }> = {
  email_processed: { icon: Mail, label: 'Email' },
  draft_created: { icon: PenLine, label: 'Draft' },
  automation_run: { icon: Zap, label: 'Automation' },
  calendar_sync: { icon: CalendarClock, label: 'Calendar' },
};

const relativeFormatter = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });

export function formatRelativeTime(iso: string) {
  const diffSeconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const absSeconds = Math.abs(diffSeconds);
  if (absSeconds < 60) return 'just now';
  if (absSeconds < 3600) return relativeFormatter.format(Math.round(diffSeconds / 60), 'minute');
  if (absSeconds < 86400) return relativeFormatter.format(Math.round(diffSeconds / 3600), 'hour');
  return relativeFormatter.format(Math.round(diffSeconds / 86400), 'day');
}

export { Clock as ActivityClockIcon };
