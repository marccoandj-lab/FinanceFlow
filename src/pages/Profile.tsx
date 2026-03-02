import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit3, Save, Shield, LogOut, Bell, Lock, Loader2, CheckCircle2 } from 'lucide-react';
import { useStore, formatCurrency, convertCurrency } from '../store/useStore';
import { useAuth } from '../firebase/AuthContext';

export default function Profile() {
  const { profile, setProfile, transactions, goals, wallets, currency, theme } = useStore();
  const { user, logout } = useAuth();
  const isDark = theme === 'dark';

  const [editing, setEditing]     = useState(false);
  const [form, setForm]           = useState({ ...profile });
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutDone, setLogoutDone] = useState(false);

  const totalBalance  = wallets.reduce((s, w) => s + convertCurrency(w.balance, w.currency, currency), 0);
  const totalIncome   = transactions.filter(t => t.type === 'income').reduce((s, t) => s + convertCurrency(t.amount, t.currency, currency), 0);
  const totalExpense  = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + convertCurrency(t.amount, t.currency, currency), 0);

  const avatarOptions = ['👤','🧑‍💼','👩‍💼','🧙‍♂️','🦸','🧑‍🚀','🎩','🦊'];

  const handleSave = () => { setProfile(form); setEditing(false); };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      setLogoutDone(true);
      await new Promise(r => setTimeout(r, 600));
      await logout();
    } catch {
      setLoggingOut(false);
      setLogoutDone(false);
    }
  };

  // Derive display name/email — prefer Firebase user data
  const displayName  = user?.displayName || profile.name || 'User';
  const displayEmail = user?.email || profile.email || '';
  const isGoogleUser = user?.providerData?.[0]?.providerId === 'google.com';

  return (
    <div className="p-4 md:p-8 space-y-6 relative z-10 pb-28 md:pb-8">

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Your account & security</p>
      </motion.div>

      {/* Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-violet-700 to-blue-700 p-6 shadow-2xl shadow-violet-500/30"
      >
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #a78bfa 0%, transparent 60%)' }} />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center shadow-xl backdrop-blur-sm overflow-hidden flex-shrink-0">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-4xl">{profile.avatar}</span>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-bold text-white truncate">{displayName}</h2>
              <p className="text-violet-200 text-sm truncate">{displayEmail}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-semibold">
                  <Shield size={10} /> Pro Member
                </span>
                {isGoogleUser && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-400/20 text-blue-300 text-xs font-semibold">
                    <svg width="10" height="10" viewBox="0 0 24 24" className="inline">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Net Worth',     value: formatCurrency(totalBalance, currency) },
              { label: 'Total Income',  value: formatCurrency(totalIncome, currency) },
              { label: 'Goals',         value: `${goals.filter(g => g.status === 'completed').length}/${goals.length}` },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-white font-bold text-sm truncate">{value}</p>
                <p className="text-violet-200 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/5" />
      </motion.div>

      {/* Edit Profile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className={`rounded-3xl p-5 ${isDark ? 'bg-gray-900/80 border border-gray-800' : 'bg-white/80 border border-gray-200'} backdrop-blur-xl shadow-xl`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">👤</span>
            <h2 className="font-bold">Personal Info</h2>
          </div>
          {!isGoogleUser && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => editing ? handleSave() : setEditing(true)}
              style={{ minHeight: 36 }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                editing ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white' : isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {editing ? <><Save size={14} /> Save</> : <><Edit3 size={14} /> Edit</>}
            </motion.button>
          )}
        </div>

        {/* Avatar picker (non-Google only) */}
        <AnimatePresence>
          {editing && !isGoogleUser && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <label className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2 block`}>Avatar</label>
              <div className="flex gap-2 flex-wrap">
                {avatarOptions.map(av => (
                  <motion.button
                    key={av} whileTap={{ scale: 0.9 }} type="button"
                    onClick={() => setForm(f => ({ ...f, avatar: av }))}
                    style={{ minHeight: 'unset' }}
                    className={`w-12 h-12 rounded-2xl text-2xl flex items-center justify-center border-2 transition-all ${
                      form.avatar === av ? 'border-violet-500 bg-violet-500/10' : isDark ? 'border-gray-700' : 'border-gray-200'
                    }`}
                  >
                    {av}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3">
          {[
            { label: 'Full Name', key: 'name'  as const, type: 'text'  },
            { label: 'Email',     key: 'email' as const, type: 'email' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1 block`}>{label}</label>
              {editing && !isGoogleUser ? (
                <input
                  type={type}
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  style={{ fontSize: 16, minHeight: 48 }}
                  className={`w-full px-4 py-3 rounded-2xl outline-none border-2 transition-colors ${
                    isDark ? 'bg-gray-800 border-gray-700 text-white focus:border-violet-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-violet-500'
                  }`}
                />
              ) : (
                <div className={`px-4 py-3 rounded-2xl ${isDark ? 'bg-gray-800/50 text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
                  <p className="text-sm font-medium">{key === 'name' ? displayName : displayEmail}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {isGoogleUser && (
          <p className={`text-xs mt-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            ℹ️ Profile info is managed by your Google account.
          </p>
        )}
      </motion.div>

      {/* Security */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className={`rounded-3xl p-5 ${isDark ? 'bg-gray-900/80 border border-gray-800' : 'bg-white/80 border border-gray-200'} backdrop-blur-xl shadow-xl`}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🔐</span>
          <h2 className="font-bold">Security</h2>
        </div>
        <div className="space-y-2">
          {[
            { icon: Lock,   label: 'Change Password',   desc: 'Update your security password',   color: 'text-blue-400' },
            { icon: Bell,   label: 'Notifications',     desc: 'Manage alerts & reminders',       color: 'text-amber-400' },
            { icon: Shield, label: 'Two-Factor Auth',   desc: 'Extra layer of security',         color: 'text-emerald-400' },
          ].map(({ icon: Icon, label, desc, color }) => (
            <motion.div
              key={label} whileHover={{ x: 4 }}
              style={{ minHeight: 64 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all cursor-pointer ${
                isDark ? 'border-gray-800 hover:border-gray-700 hover:bg-gray-800/50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <Icon size={18} className={color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{label}</p>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{desc}</p>
              </div>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${color.replace('text-', 'bg-')}`} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Financial Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className={`rounded-3xl p-5 ${isDark ? 'bg-gray-900/80 border border-gray-800' : 'bg-white/80 border border-gray-200'} backdrop-blur-xl shadow-xl`}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">📊</span>
          <h2 className="font-bold">Financial Summary</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Transactions',    value: transactions.length,                                         icon: '📝' },
            { label: 'Active Goals',    value: goals.filter(g => g.status === 'active').length,             icon: '🎯' },
            { label: 'Completed Goals', value: goals.filter(g => g.status === 'completed').length,          icon: '🏆' },
            { label: 'Total Saved',     value: formatCurrency(Math.max(0, totalIncome - totalExpense), currency), icon: '💰' },
          ].map(({ label, value, icon }) => (
            <div key={label} className={`rounded-2xl p-4 ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
              <p className="text-2xl mb-1">{icon}</p>
              <p className="font-bold text-sm">{value}</p>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Sign Out */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <motion.button
          whileHover={{ scale: loggingOut ? 1 : 1.02 }}
          whileTap={{ scale: loggingOut ? 1 : 0.97 }}
          onClick={handleLogout}
          disabled={loggingOut}
          style={{ minHeight: 56 }}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 font-semibold transition-all ${
            logoutDone
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
          }`}
        >
          {loggingOut ? (
            logoutDone ? (
              <><CheckCircle2 size={18} /> Signed out!</>
            ) : (
              <><Loader2 size={18} className="animate-spin" /> Signing out…</>
            )
          ) : (
            <><LogOut size={18} /> Sign Out</>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
}
