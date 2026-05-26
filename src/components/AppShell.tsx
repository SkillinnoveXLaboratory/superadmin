import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Icon, type IconName } from './Icon';
import { Logo } from './Logo';
import { useAuthStore } from '@/lib/stores/auth';

interface NavItem { to: string; icon: IconName; label: string }

const NAV: NavItem[] = [
  { to: '/',            icon: 'dashboard',    label: 'Overview' },
  { to: '/schools',     icon: 'school',       label: 'Schools' },
  { to: '/plans',       icon: 'finance',      label: 'Plans & Billing' },
  { to: '/users',       icon: 'parent',       label: 'Platform users' },
  { to: '/announcements', icon: 'announcement', label: 'Announcements' },
  { to: '/data',        icon: 'download',     label: 'Data ops' },
  { to: '/settings',    icon: 'settings',     label: 'Settings' },
];

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-canvas grid" style={{ gridTemplateColumns: '260px 1fr' }}>
      {/* Sidebar */}
      <aside className="border-r border-line bg-surface flex flex-col">
        <div className="px-5 h-16 flex items-center border-b border-line">
          <Logo />
        </div>
        <nav className="flex-1 py-4 px-3 flex flex-col gap-0.5">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                clsx(
                  'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-150 ease-standard',
                  isActive
                    ? 'text-brand-700 bg-brand-50'
                    : 'text-ink-500 hover:text-ink-900 hover:bg-muted'
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
          <button onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-ink-500 hover:text-danger hover:bg-danger-bg transition-colors">
            <Icon name="logout" size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-line bg-surface/80 backdrop-blur-md flex items-center px-6 sticky top-0 z-30">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative max-w-md w-full">
              <Icon name="search" size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                placeholder="Search schools, users, IDs…"
                className="input pl-9 h-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative h-10 w-10 grid place-items-center rounded-xl hover:bg-muted transition-colors">
              <Icon name="bell" size={18} className="text-ink-500" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-danger" />
            </button>
            <div className="flex items-center gap-3 pl-3 border-l border-line">
              <div className="text-right hidden md:block">
                <div className="text-[13px] font-semibold text-ink-900 leading-tight">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-[11px] text-ink-400 uppercase tracking-wider">{user?.role.replace('_', ' ')}</div>
              </div>
              <div className="h-10 w-10 rounded-full bg-brand-gradient text-white grid place-items-center font-semibold text-sm shadow-pop-30">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
            </div>
          </div>
        </header>

        {/* Routed content */}
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.24, ease: [0.2, 0, 0, 1] }}
              className="p-8 max-w-[1400px] mx-auto"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
