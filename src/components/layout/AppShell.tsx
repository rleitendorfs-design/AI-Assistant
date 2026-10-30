import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  CalendarClock,
  CalendarDays,
  CreditCard,
  Feather,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Moon,
  Plane,
  Receipt,
  Sparkles,
  Sun,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useHashRoute } from '@/hooks/useHashRoute';
import type { Theme } from '@/hooks/useTheme';

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

const SECRETARY_NAV: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Email Assistant', path: '/email', icon: Mail },
  { label: 'Calendar Rules', path: '/calendar-rules', icon: CalendarClock },
  { label: 'Billing & Subscription', path: '/billing', icon: CreditCard },
];

const WORKSPACE_NAV: NavItem[] = [
  { label: 'Calendar', path: '/calendar', icon: CalendarDays },
  { label: 'Bookings', path: '/bookings', icon: Plane },
  { label: 'Trip Assistant', path: '/trip-assistant', icon: Sparkles },
  { label: 'Expenses', path: '/expenses', icon: Receipt },
  { label: 'Contacts', path: '/contacts', icon: Users },
  { label: 'Accounting', path: '/accounting', icon: Wallet },
  { label: 'Account', path: '/account', icon: KeyRound },
];

function hrefFor(path: string) {
  return `#${path}`;
}

interface SidebarProps {
  route: string;
  theme: Theme;
  onToggleTheme: () => void;
  onNavigate: () => void;
}

function Sidebar({ route, theme, onToggleTheme, onNavigate }: SidebarProps) {
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  async function handleSignOut() {
    setSigningOut(true);
    setSignOutError(null);
    try {
      await signOut();
    } catch (err) {
      setSignOutError(err instanceof Error ? err.message : 'Could not log out.');
      setSigningOut(false);
    }
  }

  function renderItem({ label, path, icon: Icon }: NavItem) {
    const active = route === path;
    return (
      <li key={path}>
        <a
          href={hrefFor(path)}
          onClick={onNavigate}
          aria-current={active ? 'page' : undefined}
          className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
            active
              ? 'bg-emerald-50 text-emerald-800 shadow-sm'
              : 'text-neutral-600 hover:translate-x-0.5 hover:bg-neutral-100 hover:text-neutral-900'
          }`}
        >
          <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          <span className="truncate">{label}</span>
        </a>
      </li>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 px-6">
        <Feather className="h-5 w-5 text-emerald-700" strokeWidth={2} aria-hidden="true" />
        <span className="text-lg font-semibold tracking-tight text-neutral-900">Aide</span>
      </div>

      <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 pb-6">
        <p className="px-3 pb-2 pt-4 text-xs font-semibold uppercase tracking-wider text-neutral-400">Secretary</p>
        <ul className="space-y-1">{SECRETARY_NAV.map(renderItem)}</ul>

        <p className="px-3 pb-2 pt-6 text-xs font-semibold uppercase tracking-wider text-neutral-400">Workspace</p>
        <ul className="space-y-1">{WORKSPACE_NAV.map(renderItem)}</ul>
      </nav>

      <div className="space-y-3 border-t border-neutral-200 p-4">
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="flex w-full items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-emerald-600 hover:text-emerald-700"
        >
          <span>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
          {theme === 'dark' ? (
            <Moon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <Sun className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          )}
        </button>

        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-800"
            aria-hidden="true"
          >
            {user?.email?.charAt(0).toUpperCase() ?? ''}
          </div>
          <span className="min-w-0 flex-1 truncate text-sm text-neutral-700">{user?.email}</span>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-800 transition-colors hover:border-emerald-600 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          {signingOut ? 'Logging out...' : 'Log out'}
        </button>
        {signOutError && (
          <p role="alert" className="text-center text-xs text-red-700">
            {signOutError}
          </p>
        )}
      </div>
    </div>
  );
}

interface AppShellProps {
  children: ReactNode;
  theme: Theme;
  onToggleTheme: () => void;
}

export default function AppShell({ children, theme, onToggleTheme }: AppShellProps) {
  const route = useHashRoute();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-neutral-200 bg-white transition-transform duration-300 ease-out lg:translate-x-0 ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar route={route} theme={theme} onToggleTheme={onToggleTheme} onNavigate={closeDrawer} />
      </aside>

      {drawerOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={closeDrawer}
          className="fixed inset-0 z-30 animate-fade-in bg-neutral-900/40 lg:hidden"
        />
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-neutral-200 bg-white/90 px-4 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2">
            <Feather className="h-5 w-5 text-emerald-700" strokeWidth={2} aria-hidden="true" />
            <span className="text-lg font-semibold tracking-tight">Aide</span>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen((open) => !open)}
            aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={drawerOpen}
            className="rounded-lg p-2 text-neutral-700 transition-colors hover:bg-neutral-100"
          >
            {drawerOpen ? (
              <X className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            )}
          </button>
        </header>

        {children}
      </div>
    </div>
  );
}

