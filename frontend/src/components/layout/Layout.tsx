import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { MOCK_USER } from '@/hooks/useDashboardData';

const navItems = [
  { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/groups', icon: '👥', label: 'Groups' },
  { to: '/expenses', icon: '🧾', label: 'Expenses' },
  { to: '/settlements', icon: '✅', label: 'Settlements' },
];

export default function Layout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-surface border-r border-surface-border h-screen sticky top-0 shrink-0">
        {/* Logo */}
        <div className="p-6 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-lg shadow-glow">
              💸
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground tracking-tight">SplitWise</h1>
              <p className="text-xs text-foreground-subtle">Expense Splitter</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-accent/15 text-accent-light border border-accent/20 shadow-glow'
                    : 'text-foreground-muted hover:text-foreground hover:bg-surface-elevated',
                )
              }
            >
              <span className="text-base">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-surface-border">
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-elevated transition-colors cursor-pointer">
            <Avatar name={MOCK_USER.name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{MOCK_USER.name}</p>
              <p className="text-xs text-foreground-subtle truncate">{MOCK_USER.email}</p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="text-foreground-subtle hover:text-danger transition-colors text-sm"
              title="Sign out"
            >
              ↩
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Topbar */}
        <header className="lg:hidden sticky top-0 z-10 bg-surface/80 backdrop-blur-md border-b border-surface-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-base shadow-glow">
              💸
            </div>
            <h1 className="text-base font-bold text-foreground">SplitWise</h1>
          </div>
          <Avatar name={MOCK_USER.name} size="sm" />
        </header>

        {/* Mobile Bottom Nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-10 bg-surface/80 backdrop-blur-md border-t border-surface-border flex items-center">
          {navItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-medium transition-all',
                  isActive ? 'text-accent-light' : 'text-foreground-subtle',
                )
              }
            >
              <span className="text-xl leading-none">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Page */}
        <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
