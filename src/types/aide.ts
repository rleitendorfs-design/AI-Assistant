export interface Meeting {
  id: string;
  title: string;
  meeting_date: string;
  start_time: string;
  end_time: string | null;
  location: string | null;
  notes: string | null;
}

export interface MeetingInput {
  title: string;
  meeting_date: string;
  start_time: string;
  end_time: string | null;
  location: string | null;
  notes: string | null;
}

export interface Contact {
  id: string;
  name: string;
  company: string | null;
  role: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
}

export type ContactInput = Omit<Contact, 'id'>;

export const EXPENSE_CATEGORIES = ['meals', 'travel', 'lodging', 'software', 'office', 'other'] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface Expense {
  id: string;
  merchant: string;
  amount_cents: number;
  category: ExpenseCategory;
  expense_date: string;
  note: string | null;
  contact_id: string | null;
}

export type ExpenseInput = Omit<Expense, 'id'>;

export type InvoiceStatus = 'open' | 'paid';

export interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  amount_cents: number;
  issued_on: string;
  due_on: string;
  status: InvoiceStatus;
}

export type InvoiceInput = Omit<Invoice, 'id'>;

export const BOOKING_KINDS = ['flight', 'stay', 'other'] as const;

export type BookingKind = (typeof BOOKING_KINDS)[number];

export const BOOKING_STATUSES = ['planned', 'booked', 'cancelled'] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export interface Booking {
  id: string;
  kind: BookingKind;
  title: string;
  provider: string | null;
  confirmation_code: string | null;
  location: string | null;
  starts_on: string;
  ends_on: string | null;
  amount_cents: number | null;
  status: BookingStatus;
  notes: string | null;
}

export type BookingInput = Omit<Booking, 'id'>;
