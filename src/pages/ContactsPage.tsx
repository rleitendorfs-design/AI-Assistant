import { useMemo, useState } from 'react';
import { AlertCircle, Mail, Phone, Plus, RotateCcw, Search } from 'lucide-react';
import ContactFormModal from '@/components/contacts/ContactFormModal';
import { deleteContact, fetchContacts, saveContact } from '@/lib/contactsApi';
import { useAsyncList } from '@/hooks/useAsyncList';
import type { Contact } from '@/types/aide';

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

function matches(contact: Contact, query: string) {
  const haystack = [contact.name, contact.company, contact.role, contact.email]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

type Editor = { contact: Contact | null } | null;

export default function ContactsPage() {
  const { items: contacts, loadState, loadError, reload } = useAsyncList(fetchContacts);
  const [query, setQuery] = useState('');
  const [editor, setEditor] = useState<Editor>(null);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? contacts.filter((contact) => matches(contact, term)) : contacts;
  }, [contacts, query]);

  return (
    <div>

      <main className="mx-auto max-w-5xl px-6 pb-20 pt-10 md:px-10 md:pt-14">
        <div className="animate-fade-up flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500">
              {loadState === 'ready' ? `${contacts.length} saved` : 'Your people'}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Contacts</h1>
          </div>
          <button
            type="button"
            onClick={() => setEditor({ contact: null })}
            className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:bg-emerald-800 hover:shadow-md sm:self-auto"
          >
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            Add contact
          </button>
        </div>

        {loadState === 'ready' && contacts.length > 0 && (
          <div className="relative mt-8">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, company, or role"
              aria-label="Search contacts"
              className="w-full rounded-xl border border-neutral-300 bg-white py-3 pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100"
            />
          </div>
        )}

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

        {loadState === 'loading' && <p className="mt-10 text-sm text-neutral-500">Loading contacts...</p>}

        {loadState === 'ready' && contacts.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-neutral-300 px-6 py-14 text-center">
            <p className="text-sm font-medium text-neutral-800">No contacts yet</p>
            <p className="mt-1 text-sm text-neutral-500">Save the people you work with so their details are one tap away.</p>
          </div>
        )}

        {loadState === 'ready' && contacts.length > 0 && visible.length === 0 && (
          <p className="mt-10 text-center text-sm text-neutral-500">No contacts match “{query.trim()}”.</p>
        )}

        {visible.length > 0 && (
          <ul className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            {visible.map((contact) => (
              <li key={contact.id}>
                <button
                  type="button"
                  onClick={() => setEditor({ contact })}
                  className="group flex w-full items-start gap-4 rounded-2xl border border-neutral-200 bg-white p-5 text-left shadow-soft transition-all hover:-translate-y-px hover:border-emerald-200 hover:shadow-lifted"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold text-emerald-800" aria-hidden="true">
                    {initialsFor(contact.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-neutral-900">{contact.name}</p>
                    {(contact.role || contact.company) && (
                      <p className="mt-0.5 truncate text-sm text-neutral-500">
                        {[contact.role, contact.company].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    <div className="mt-3 flex flex-col gap-1.5 text-xs text-neutral-600">
                      {contact.email && (
                        <span className="flex items-center gap-2 truncate">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-neutral-400" strokeWidth={1.75} aria-hidden="true" />
                          <span className="truncate">{contact.email}</span>
                        </span>
                      )}
                      {contact.phone && (
                        <span className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 shrink-0 text-neutral-400" strokeWidth={1.75} aria-hidden="true" />
                          <span className="tabular-nums">{contact.phone}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      {editor && (
        <ContactFormModal
          key={editor.contact?.id ?? 'new'}
          contact={editor.contact}
          onClose={() => setEditor(null)}
          onSave={async (input) => {
            await saveContact(input, editor.contact?.id ?? null);
            setEditor(null);
            reload();
          }}
          onDelete={async () => {
            if (!editor.contact) return;
            await deleteContact(editor.contact.id);
            setEditor(null);
            reload();
          }}
        />
      )}
    </div>
  );
}
