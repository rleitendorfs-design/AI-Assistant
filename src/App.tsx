import AppShell from '@/components/layout/AppShell';
import AccountingPage from '@/pages/AccountingPage';
import AccountPage from '@/pages/AccountPage';
import BookingsPage from '@/pages/BookingsPage';
import TripAssistantPage from '@/pages/TripAssistantPage';
import BillingPage from '@/pages/BillingPage';
import CalendarPage from '@/pages/CalendarPage';
import CalendarRulesPage from '@/pages/CalendarRulesPage';
import ContactsPage from '@/pages/ContactsPage';
import DashboardPage from '@/pages/DashboardPage';
import EmailAssistantPage from '@/pages/EmailAssistantPage';
import ExpensesPage from '@/pages/ExpensesPage';
import WelcomePage from '@/pages/WelcomePage';
import { useAuth } from '@/hooks/useAuth';
import { useHashRoute } from '@/hooks/useHashRoute';
import { useTheme } from '@/hooks/useTheme';

function renderRoute(route: string) {
  switch (route) {
    case '/email':
      return <EmailAssistantPage />;
    case '/calendar-rules':
      return <CalendarRulesPage />;
    case '/billing':
      return <BillingPage />;
    case '/calendar':
      return <CalendarPage />;
    case '/expenses':
      return <ExpensesPage />;
    case '/contacts':
      return <ContactsPage />;
    case '/accounting':
      return <AccountingPage />;
    case '/bookings':
      return <BookingsPage />;
    case '/trip-assistant':
      return <TripAssistantPage />;
    case '/account':
      return <AccountPage />;
    default:
      return <DashboardPage />;
  }
}

function App() {
  const route = useHashRoute();
  const { user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (loading) {
    return <div className="min-h-screen bg-white" aria-busy="true" />;
  }

  if (!user) return <WelcomePage />;

  return (
    <AppShell theme={theme} onToggleTheme={toggleTheme}>
      {renderRoute(route)}
    </AppShell>
  );
}

export default App;

