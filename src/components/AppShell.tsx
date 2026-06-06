import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { Icon, type IconName } from './Icon';
import { Logo } from './Logo';
import { useAuthStore } from '@/lib/stores/auth';

interface NavItem {
  to: string;
  icon: IconName;
  label: string;
}

const NAV: NavItem[] = [
  { to: '/', icon: 'dashboard', label: 'Overview' },
  { to: '/schools', icon: 'school', label: 'Schools' },
  { to: '/students', icon: 'students', label: 'Students' },
];

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  function handleSignOut() {
    logout();
    navigate('/login');
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-canvas md:grid md:grid-cols-[260px_1fr]">
      <AnimatePresence>
        {mobileNavOpen && (
          <motion.button
            type="button"
            aria-label="Close sidebar backdrop"
            className="fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-[1px] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileNavOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-[86vw] max-w-xs border-r border-line bg-surface flex flex-col shadow-2xl transition-transform duration-200 md:sticky md:top-0 md:z-auto md:h-screen md:w-auto md:max-w-none md:shadow-none',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        <div className="px-5 h-16 flex items-center justify-between border-b border-line">
          <Logo />
          <button
            className="md:hidden h-9 w-9 grid place-items-center rounded-xl hover:bg-muted"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close sidebar"
            type="button"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 flex flex-col gap-0.5 overflow-y-auto">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileNavOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-150 ease-standard',
                  isActive ? 'text-brand-700 bg-brand-50' : 'text-ink-500 hover:text-ink-900 hover:bg-muted',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="active-pill"
                      className="absolute inset-0 rounded-xl bg-brand-50 -z-10"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon name={item.icon} size={18} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-line">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-ink-500 hover:text-danger hover:bg-danger-bg transition-colors"
            type="button"
          >
            <Icon name="logout" size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <div className="flex flex-col min-w-0">
        <header className="h-16 border-b border-line bg-surface/80 backdrop-blur-md flex items-center px-4 md:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              type="button"
              className="md:hidden h-10 w-10 grid place-items-center rounded-xl hover:bg-muted shrink-0"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open sidebar"
            >
              <Icon name="menu" size={20} className="text-ink-700" />
            </button>
            <div className="relative max-w-md w-full hidden sm:block">
              <Icon
                name="search"
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
              />
              <input
                placeholder="Search schools, users, IDs…"
                className="input pl-9 h-10"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative h-10 w-10 grid place-items-center rounded-xl hover:bg-muted transition-colors" type="button">
              <Icon name="bell" size={18} className="text-ink-500" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-danger" />
            </button>
            <div className="flex items-center gap-3 pl-3 border-l border-line">
              <div className="text-right hidden md:block">
                <div className="text-[13px] font-semibold text-ink-900 leading-tight">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-[11px] text-ink-400 uppercase tracking-wider">
                  {user?.role.replace('_', ' ')}
                </div>
              </div>
              <div className="h-10 w-10 rounded-full bg-brand-gradient text-white grid place-items-center font-semibold text-sm shadow-pop-30">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 min-w-0 min-h-screen">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.24, ease: [0.2, 0, 0, 1] }}
              className="p-4 sm:p-6 xl:p-8 max-w-[1400px] mx-auto w-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
