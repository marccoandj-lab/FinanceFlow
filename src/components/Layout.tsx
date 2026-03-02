import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Target, BarChart3, ArrowLeftRight, Wallet, Settings, User, LogOut,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useAuth } from '../firebase/AuthContext';
import AnimatedBackground from './AnimatedBackground';
import PWAInstallBanner from './PWAInstallBanner';
import PWAInstallButton from './PWAInstallButton';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/stats', icon: BarChart3, label: 'Stats' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/wallets', icon: Wallet, label: 'Wallets' },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const mobileNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/stats', icon: BarChart3, label: 'Stats' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Txns' },
  { to: '/wallets', icon: Wallet, label: 'Wallets' },
  { to: '/settings', icon: Settings, label: 'More' },
];

interface LayoutProps {
  children: React.ReactNode;
}

function useIsDark() {
  const { theme } = useStore();
  const [sysDark, setSysDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSysDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return theme === 'dark' || (theme === 'system' && sysDark);
}

export default function Layout({ children }: LayoutProps) {
  const { profile } = useStore();
  const { user, logout } = useAuth();
  const location = useLocation();
  const isDark = useIsDark();

  return (
    <div
      className={`min-h-screen flex ${isDark ? 'dark bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`}
    >
      <AnimatedBackground isDark={isDark} />

      {/* ── PWA Install Banner (global, above everything) ── */}
      <PWAInstallBanner isDark={isDark} />

      {/* ── Desktop Sidebar ── */}
      <aside
        className={`
          hidden md:flex flex-col w-60 lg:w-64 min-h-screen
          fixed left-0 top-0 z-20
          ${isDark ? 'bg-gray-900/90 border-gray-800' : 'bg-white/90 border-gray-200'}
          backdrop-blur-xl border-r shadow-2xl
        `}
      >
        {/* Logo */}
        <div className={`p-5 border-b ${isDark ? 'border-gray-800/50' : 'border-gray-200/50'} flex-shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-lg shadow-violet-500/30 flex-shrink-0">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <div>
              <h1 className="font-bold text-base bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                FinanceFlow
              </h1>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Pro Dashboard</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 lg:p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}>
              {({ isActive }) => (
                <div
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer
                    transition-all duration-150 select-none
                    ${isActive
                      ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-500/25'
                      : isDark
                        ? 'text-gray-400 hover:text-white hover:bg-white/5'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  <span className="font-medium text-sm">{label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white opacity-80" />
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: install + tip + user */}
        <div className={`p-3 lg:p-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'} space-y-3 flex-shrink-0`}>
          {/* PWA Install button (sidebar compact) */}
          <PWAInstallButton isDark={isDark} variant="sidebar" />

          {/* User card */}
          <NavLink to="/profile">
            <div className={`flex items-center gap-3 p-3 rounded-2xl transition-colors cursor-pointer ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
                {user?.photoURL
                  ? <img src={user.photoURL} alt="avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  : (profile.name ? profile.name.charAt(0).toUpperCase() : <User size={14} />)
                }
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate">{user?.displayName || profile.name || 'My Account'}</p>
                <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {user?.email || profile.email || 'View profile'}
                </p>
              </div>
            </div>
          </NavLink>

          {/* Logout button */}
          <button
            onClick={() => logout()}
            style={{ minHeight: 40 }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-2xl text-sm font-medium transition-all text-red-400 hover:bg-red-500/10 ${isDark ? '' : 'hover:bg-red-50'}`}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>

          <div
            className={`rounded-2xl p-3 ${
              isDark
                ? 'bg-gradient-to-br from-violet-900/40 to-blue-900/40 border border-violet-500/20'
                : 'bg-gradient-to-br from-violet-50 to-blue-50 border border-violet-200'
            }`}
          >
            <p className={`text-xs font-semibold ${isDark ? 'text-violet-300' : 'text-violet-700'}`}>💡 Tip</p>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Add income first, then track expenses to see your savings rate.
            </p>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main
        className="
          flex-1 md:ml-60 lg:ml-64
          min-h-screen
          md:pb-8
          overflow-x-hidden overflow-y-auto
          main-content
        "
        style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="min-h-full"
        >
          {children}
        </motion.div>
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav
        className={`
          md:hidden fixed bottom-0 left-0 right-0
          ${isDark ? 'bg-gray-900/98 border-gray-800' : 'bg-white/98 border-gray-200'}
          backdrop-blur-2xl border-t shadow-2xl
        `}
        style={{
          zIndex: 900,          /* below modal portals (99999) but above page content */
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="flex items-stretch h-16">
          {mobileNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className="flex-1"
            >
              {({ isActive }) => (
                <div
                  className={`
                    flex flex-col items-center justify-center h-full gap-0.5
                    transition-all duration-150 select-none cursor-pointer
                    active:scale-95
                    ${isActive
                      ? isDark ? 'text-violet-400' : 'text-violet-600'
                      : isDark ? 'text-gray-500' : 'text-gray-400'
                    }
                  `}
                >
                  <div
                    className={`
                      w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-150
                      ${isActive
                        ? 'bg-gradient-to-br from-violet-600 to-blue-600 shadow-lg shadow-violet-500/30'
                        : ''
                      }
                    `}
                  >
                    <Icon size={18} className={isActive ? 'text-white' : ''} />
                  </div>
                  <span className="text-[9px] font-semibold leading-none mt-0.5">{label}</span>
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
