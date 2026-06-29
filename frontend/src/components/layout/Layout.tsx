import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/useAuthStore';
import { useLogoutMutation } from '@/hooks/useAuthQueries';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { motion, Variants } from 'framer-motion';

const navItems = [
  { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/groups', icon: '👥', label: 'Groups' },
  { to: '/expenses', icon: '🧾', label: 'Expenses' },
  { to: '/settlements', icon: '✅', label: 'Settlements' },
];

export default function Layout() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogoutMutation();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate('/login');
  };

  const username = user?.name || 'Guest User';
  const email = user?.email || '';

  // framer-motion stagger containers
  const sidebarNavVariants: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.08 }
    }
  };

  const navItemVariants: Variants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 200, damping: 18 } }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex text-[#F5F5F5] font-body">
      
      {/* 1. Sidebar - visible md/lg collapse, hidden mobile */}
      <aside className="hidden md:flex flex-col md:w-16 lg:w-[240px] bg-[#0d0d0d] border-r border-white/6 h-screen sticky top-0 shrink-0 z-40">
        
        {/* Top Logo */}
        <div className="p-4 lg:p-6 border-b border-white/5 flex items-center justify-center lg:justify-start gap-2.5 select-none">
          <span className="w-3 h-3 rounded-full bg-[#10b981] shadow-[0_0_12px_#10b981] shrink-0" />
          <span className="hidden lg:inline font-heading text-lg font-extrabold tracking-tight text-white">
            SplitWise
          </span>
        </div>

        {/* Nav list with motion stagger */}
        <motion.nav
          variants={sidebarNavVariants}
          initial="hidden"
          animate="visible"
          className="flex-1 p-3 space-y-1.5"
        >
          {navItems.map(({ to, icon, label }) => (
            <motion.div
              key={to}
              variants={navItemVariants}
              whileHover={{ x: 2 }}
            >
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    'relative flex items-center justify-center lg:justify-start gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider select-none transition-all duration-200 group/nav',
                    isActive
                      ? 'bg-[#10b981]/10 text-[#10b981] border-l-2 border-[#10b981]'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.04]',
                  )
                }
              >
                <span className="text-base shrink-0">{icon}</span>
                <span className="hidden lg:inline">{label}</span>

                {/* Tooltip for collapsed tablet sidebar */}
                <span className="hidden md:group-hover/nav:block lg:group-hover/nav:hidden absolute left-20 bg-[#161616] border border-white/10 text-white text-[10px] uppercase font-bold tracking-wider py-1.5 px-3 rounded shadow-xl whitespace-nowrap z-50">
                  {label}
                </span>
              </NavLink>
            </motion.div>
          ))}
        </motion.nav>

        {/* User Card & Logout bottom section */}
        <div className="p-3 border-t border-white/5 space-y-2">
          {/* User profile details (Desktop) */}
          <div className="hidden lg:flex items-center gap-3 p-2 bg-white/[0.01] border border-white/5 rounded-xl select-none">
            <Avatar name={username} size="sm" className="shrink-0" />
            <div className="flex flex-col flex-1 min-w-0 text-left">
              <p className="text-xs font-bold text-white truncate leading-snug">{username}</p>
              <p className="text-[9px] text-gray-500 truncate mt-0.5">{email}</p>
            </div>
          </div>
          
          {/* Collapse state Avatar (Tablet) */}
          <div className="lg:hidden flex justify-center py-1 select-none">
            <Avatar name={username} size="sm" className="shrink-0" />
          </div>

          {/* Premium Sign Out Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/30 rounded-xl text-[10px] font-bold uppercase tracking-wider text-rose-450 hover:text-rose-350 transition-all select-none cursor-pointer"
            title="Sign Out"
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            <span className="hidden lg:inline">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Body */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a] bg-dot-grid relative min-h-screen">
        
        {/* Mobile Header topbar */}
        <header className="md:hidden sticky top-0 z-30 bg-[#0d0d0d]/85 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 select-none">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-[0_0_10px_#10b981]" />
            <h1 className="font-heading text-base font-extrabold text-white">SplitWise</h1>
          </div>
          <div className="flex items-center gap-3">
            <Avatar name={username} size="sm" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 py-1.5 px-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/30 rounded-lg text-[9px] font-bold uppercase tracking-wider text-rose-450 hover:text-rose-350 transition-all select-none cursor-pointer"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              <span>Out</span>
            </button>
          </div>
        </header>

        {/* Mobile Bottom Tab Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d0d0d]/90 backdrop-blur-md border-t border-white/6 flex items-center justify-around pb-[env(safe-area-inset-bottom,0px)] h-[calc(60px+env(safe-area-inset-bottom,0px))]">
          {navItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center flex-1 py-1.5 text-[9px] uppercase tracking-wider font-bold transition-all',
                  isActive ? 'text-[#10b981]' : 'text-gray-500',
                )
              }
            >
              <span className="text-lg mb-0.5">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Page rendering viewport */}
        <main className="flex-1 p-6 lg:p-10 pb-[calc(88px+env(safe-area-inset-bottom,0px))] md:pb-6 max-w-7xl w-full mx-auto relative z-10 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
