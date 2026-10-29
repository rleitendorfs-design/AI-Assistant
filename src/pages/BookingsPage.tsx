import { useMemo, useState } from 'react';
import { AlertCircle, BedDouble, ExternalLink, Plane, Plus, RotateCcw, Ticket, type LucideIcon } from 'lucide-react';
import BookingFormModal from '@/components/bookings/BookingFormModal';
import { useAsyncList } from '@/hooks/useAsyncList';
import { deleteBooking, fetchBookings, saveBooking } from '@/lib/bookingsApi';
import { formatCents } from '@/lib/money';
import { parseDateKey, toDateKey } from '@/lib/dates';
import type { Booking, BookingKind } from '@/types/aide';

const KIND_ICONS: Record<BookingKind, LucideIcon> = {
  flight: Plane,
  stay: BedDouble,
  other: Ticket,
};

const STATUS_STYLES: Record<Booking['status'], { label: string; className: string }> = {
  planned: { label: 'Planned', className: 'bg-amber-50 text-amber-800' },
  booked: { label: 'Booked', className: 'bg-emerald-50 text-emerald-800' },
  cancelled: { label: 'Cancelled', className: 'bg-neutral-100 text-neutral-600' },
};

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function formatRange(booking: Booking) {
  const start = dateFormatter.format(parseDateKey(booking.starts_on));
  if (!booking.ends_on || booking.ends_on === booking.starts_on) return start;
  return `${start} – ${dateFormatter.format(parseDateKey(booking.ends_on))}`;
}

function lastDayOf(booking: Booking) {
  return booking.ends_on ?? booking.starts_on;
}

const BOOKING_SITES = [
  {
    label: 'Search stays on Booking.com',
    href: 'https://www.booking.com',
    icon: BedDouble,
  },
  {
    label: 'Search flights on Skyscanner',
    href: 'https://www.skyscanner.com',
    icon: Plane,
  },
];

type Editor = { booking: Booking | null } | null;

function BookingRow({ booking, onOpen }: { booking: Booking; onOpen: () => void }) {
  const Icon = KIND_ICONS[booking.kind];
  const status = STATUS_STYLES[booking.status];
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="group flex w-full items-start gap-4 rounded-2xl border border-neutral-200 bg-white p-5 text-left shadow-soft transition-all hover:-translate-y-px hover:border-emerald-200 hover:shadow-lifted"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-800" aria-hidden="true">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-semibold text-neutral-900">{booking.title}</p>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>{status.label}</span>
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            {[booking.provider, booking.location].filter(Boolean).join(' · ') || 'No details yet'}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-600">
            <span className="tabular-nums">{formatRange(booking)}</span>
            {booking.confirmation_code && <span>Confirmation {booking.confirmation_code}</span>}
            {booking.amount_cents !== null && <span className="tabular-nums">{formatCents(booking.amount_cents)}</span>}
          </div>
        </div>
      </button>
    </li>
  );
}

export default function BookingsPage() {
  const { items: bookings, loadState, loadError, reload } = useAsyncList(fetchBookings);
  const [editor, setEditor] = useState<Editor>(null);

  const { upcoming, past } = useMemo(() => {
    const today = toDateKey(new Date());
    const upcomingList: Booking[] = [];
    const pastList: Booking[] = [];
    for (const booking of bookings) {
      if (lastDayOf(booking) >= today) upcomingList.push(booking);
      else pastList.push(booking);
    }
    pastList.reverse();
    return { upcoming: upcomingList, past: pastList };
  }, [bookings]);

  return (
    <div>
      <main className="mx-auto max-w-5xl px-6 pb-20 pt-10 md:px-10 md:pt-14">
        <div className="animate-fade-up flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500">
              {loadState === 'ready' ? `${upcoming.length} upcoming` : 'Your trips and reservations'}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Bookings</h1>
          </div>
          <button
            type="button"
            onClick={() => setEditor({ booking: null })}
            className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:bg-emerald-800 hover:shadow-md sm:self-auto"
          >
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            Add booking
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {BOOKING_SITES.map(({ label, href, icon: Icon }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-3 rounded-2xl border border-dashed border-neutral-300 bg-white px-5 py-4 text-sm font-medium text-neutral-800 transition-all hover:border-emerald-600 hover:text-emerald-800"
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-neutral-500 group-hover:text-emerald-700" strokeWidth={1.75} aria-hidden="true" />
                {label}
              </span>
              <ExternalLink className="h-4 w-4 text-neutral-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
            </a>
          ))}
        </div>
        <p className="mt-3 text-xs text-neutral-500">
          Book on the provider's site, then add the confirmation here so every trip stays in one place.
        </p>

        {loadState === 'error' && (
          <div role="alert" className="mt-8 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>{loadError}</p>
            </div>
            <button type="button" onClick={reload} className="inline-flex items-center gap-2 self-start font-medium text-red-900 underline-offset-4 hover:underline">
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Try again
            </button>
          </div>
        )}

        {loadState === 'loading' && <p className="mt-10 text-sm text-neutral-500">Loading bookings...</p>}

        {loadState === 'ready' && bookings.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-neutral-300 px-6 py-14 text-center">
            <p className="text-sm font-medium text-neutral-800">No bookings yet</p>
            <p className="mt-1 text-sm text-neutral-500">Add a flight, stay, or other reservation to keep its details in one place.</p>
          </div>
        )}

        {upcoming.length > 0 && (
          <section className="mt-10" aria-labelledby="upcoming-heading">
            <h2 id="upcoming-heading" className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
              Upcoming
            </h2>
            <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {upcoming.map((booking) => (
                <BookingRow key={booking.id} booking={booking} onOpen={() => setEditor({ booking })} />
              ))}
            </ul>
          </section>
        )}

        {past.length > 0 && (
          <section className="mt-12" aria-labelledby="past-heading">
            <h2 id="past-heading" className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
              Past
            </h2>
            <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {past.map((booking) => (
                <BookingRow key={booking.id} booking={booking} onOpen={() => setEditor({ booking })} />
              ))}
            </ul>
          </section>
        )}
      </main>

      {editor && (
        <BookingFormModal
          key={editor.booking?.id ?? 'new'}
          booking={editor.booking}
          onClose={() => setEditor(null)}
          onSave={async (input) => {
            await saveBooking(input, editor.booking?.id ?? null);
            setEditor(null);
            reload();
          }}
          onDelete={async () => {
            if (!editor.booking) return;
            await deleteBooking(editor.booking.id);
            setEditor(null);
            reload();
          }}
        />
      )}
    </div>
  );
}
