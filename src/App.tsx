import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './firebase/AuthContext';
import Layout from './components/Layout';
import Onboarding from './components/Onboarding';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Goals from './pages/Goals';
import Stats from './pages/Stats';
import Transactions from './pages/Transactions';
import Wallets from './pages/Wallets';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import { useStore } from './store/useStore';
import { useEffect } from 'react';

// Sync Firebase user → Zustand profile
function ProfileSync() {
  const { user } = useAuth();
  const { setProfile, profile } = useStore();

  useEffect(() => {
    if (user && !profile.name) {
      setProfile({
        name:   user.displayName || user.email?.split('@')[0] || 'User',
        email:  user.email || '',
        avatar: user.photoURL || '👤',
      });
    }
  }, [user]);

  return null;
}

function AppContent() {
  const { user, loading } = useAuth();
  const { onboardingComplete, setOnboardingComplete } = useStore();

  // Full-screen loader while Firebase resolves auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-violet-500/40">
          <span className="text-white font-black text-2xl">F</span>
        </div>
        <Loader2 size={24} className="animate-spin text-violet-400" />
        <p className="text-gray-500 text-sm">Loading FinanceFlow…</p>
      </div>
    );
  }

  // Not authenticated → show Auth page
  if (!user) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="auth"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Auth />
        </motion.div>
      </AnimatePresence>
    );
  }

  // Authenticated → show app
  return (
    <>
      <ProfileSync />

      {/* Onboarding overlay */}
      <AnimatePresence>
        {!onboardingComplete && (
          <motion.div
            key="onboarding"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100]"
          >
            <Onboarding onComplete={() => setOnboardingComplete(true)} />
          </motion.div>
        )}
      </AnimatePresence>

      <Layout>
        <Routes>
          <Route path="/"             element={<Dashboard />} />
          <Route path="/goals"        element={<Goals />} />
          <Route path="/stats"        element={<Stats />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/wallets"      element={<Wallets />} />
          <Route path="/settings"     element={<Settings />} />
          <Route path="/profile"      element={<Profile />} />
        </Routes>
      </Layout>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
