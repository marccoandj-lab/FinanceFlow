import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../firebase/AuthContext';

type Mode = 'login' | 'signup' | 'reset';

export default function Auth() {
  const { signIn, signUp, signInWithGoogle, resetPassword, error, clearError } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [showCf, setShowCf]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Clear errors when switching modes
  useEffect(() => {
    clearError();
    setLocalError(null);
    setResetSent(false);
  }, [mode]);

  const displayError = localError || error;

  const validateSignup = (): string | null => {
    if (!name.trim()) return 'Please enter your full name.';
    if (!email.trim()) return 'Please enter your email.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (password !== confirm) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (mode === 'reset') {
      if (!email.trim()) { setLocalError('Please enter your email.'); return; }
      try {
        setLoading(true);
        await resetPassword(email);
        setResetSent(true);
      } catch { /* error set by context */ } finally { setLoading(false); }
      return;
    }

    if (mode === 'signup') {
      const err = validateSignup();
      if (err) { setLocalError(err); return; }
    }

    try {
      setLoading(true);
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password, name);
      }
    } catch { /* error set by context */ } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setLocalError(null);
    clearError();
    try {
      setGoogleLoading(true);
      await signInWithGoogle();
    } catch { /* error set by context */ } finally { setGoogleLoading(false); }
  };

  // Floating orbs for background
  const orbs = [
    { cx: '10%',  cy: '20%', r: 320, color: '#7c3aed', delay: 0    },
    { cx: '85%',  cy: '15%', r: 280, color: '#2563eb', delay: 0.8  },
    { cx: '60%',  cy: '80%', r: 260, color: '#7c3aed', delay: 1.6  },
    { cx: '20%',  cy: '75%', r: 200, color: '#0ea5e9', delay: 0.4  },
  ];

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gray-950">

      {/* ── Animated background ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {orbs.map((o, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: o.cx, top: o.cy,
              width: o.r * 2, height: o.r * 2,
              marginLeft: -o.r, marginTop: -o.r,
              background: `radial-gradient(circle, ${o.color}22 0%, transparent 70%)`,
              filter: 'blur(40px)',
            }}
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.5, 0.8, 0.5],
              x: [0, 20, 0],
              y: [0, -20, 0],
            }}
            transition={{ duration: 6 + i, repeat: Infinity, delay: o.delay, ease: 'easeInOut' }}
          />
        ))}
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(139,92,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* ── Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full mx-4"
        style={{ maxWidth: 440 }}
      >
        {/* Card shell */}
        <div
          className="rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: 'rgba(15, 15, 25, 0.85)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {/* Header gradient bar */}
          <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-blue-500 to-violet-500" />

          <div className="p-7 sm:p-8">

            {/* Logo + title */}
            <div className="flex flex-col items-center mb-7">
              <motion.div
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-violet-500/40 mb-4"
                whileHover={{ scale: 1.05, rotate: 3 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <span className="text-white font-black text-2xl">F</span>
              </motion.div>
              <h1 className="text-2xl font-black text-white tracking-tight">FinanceFlow</h1>
              <p className="text-sm text-gray-400 mt-1">
                {mode === 'login'  && 'Welcome back! Sign in to continue.'}
                {mode === 'signup' && 'Create your account and start tracking.'}
                {mode === 'reset'  && 'Reset your password via email.'}
              </p>
            </div>

            {/* Mode tabs (login / signup) */}
            {mode !== 'reset' && (
              <div className="flex rounded-2xl p-1 mb-6" style={{ background: 'rgba(255,255,255,0.05)' }}>
                {(['login', 'signup'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 capitalize"
                    style={{
                      minHeight: 44,
                      background: mode === m ? 'linear-gradient(135deg, #7c3aed, #2563eb)' : 'transparent',
                      color: mode === m ? '#fff' : 'rgba(255,255,255,0.45)',
                      boxShadow: mode === m ? '0 4px 12px rgba(124,58,237,0.4)' : 'none',
                    }}
                  >
                    {m === 'login' ? 'Sign In' : 'Sign Up'}
                  </button>
                ))}
              </div>
            )}

            {/* Error / success banners */}
            <AnimatePresence mode="wait">
              {displayError && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  className="flex items-start gap-2.5 p-3.5 rounded-2xl mb-4 text-sm"
                  style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}
                >
                  <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-red-300 leading-snug">{displayError}</span>
                </motion.div>
              )}
              {resetSent && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-2.5 p-3.5 rounded-2xl mb-4 text-sm"
                  style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}
                >
                  <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-emerald-300 leading-snug">
                    Reset email sent! Check your inbox and follow the instructions.
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">

              {/* Name (signup only) */}
              <AnimatePresence>
                {mode === 'signup' && (
                  <motion.div
                    key="name"
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 ml-1">Full Name</label>
                    <div className="relative">
                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="John Doe"
                        autoComplete="name"
                        style={{ fontSize: 16, minHeight: 52, background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)' }}
                        className="w-full pl-11 pr-4 py-3 rounded-2xl text-white placeholder-gray-600 outline-none transition-all focus:border-violet-500 focus:shadow-lg focus:shadow-violet-500/10"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 ml-1">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    style={{ fontSize: 16, minHeight: 52, background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)' }}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl text-white placeholder-gray-600 outline-none transition-all focus:border-violet-500 focus:shadow-lg focus:shadow-violet-500/10"
                  />
                </div>
              </div>

              {/* Password (not for reset) */}
              <AnimatePresence>
                {mode !== 'reset' && (
                  <motion.div
                    key="password"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 ml-1">Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        style={{ fontSize: 16, minHeight: 52, background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)' }}
                        className="w-full pl-11 pr-12 py-3 rounded-2xl text-white placeholder-gray-600 outline-none transition-all focus:border-violet-500 focus:shadow-lg focus:shadow-violet-500/10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                        style={{ minHeight: 'unset', minWidth: 'unset' }}
                      >
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Confirm password (signup only) */}
              <AnimatePresence>
                {mode === 'signup' && (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 ml-1">Confirm Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                      <input
                        type={showCf ? 'text' : 'password'}
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        style={{ fontSize: 16, minHeight: 52, background: 'rgba(255,255,255,0.05)', border: `1.5px solid ${confirm && confirm !== password ? 'rgba(239,68,68,0.5)' : confirm && confirm === password ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.1)'}` }}
                        className="w-full pl-11 pr-12 py-3 rounded-2xl text-white placeholder-gray-600 outline-none transition-all focus:border-violet-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCf(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                        style={{ minHeight: 'unset', minWidth: 'unset' }}
                      >
                        {showCf ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {/* Password match indicator */}
                    {confirm.length > 0 && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`text-xs ml-1 mt-1 font-medium ${confirm === password ? 'text-emerald-400' : 'text-red-400'}`}
                      >
                        {confirm === password ? '✓ Passwords match' : '✗ Passwords do not match'}
                      </motion.p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Forgot password link */}
              {mode === 'login' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setMode('reset')}
                    className="text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium"
                    style={{ minHeight: 'unset', background: 'none', border: 'none', padding: '2px 0' }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Submit button */}
              <motion.button
                type="submit"
                disabled={loading || resetSent}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full flex items-center justify-center gap-2 rounded-2xl font-bold text-white transition-all"
                style={{
                  minHeight: 52,
                  marginTop: 8,
                  background: loading || resetSent
                    ? 'rgba(124,58,237,0.4)'
                    : 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
                  boxShadow: loading || resetSent ? 'none' : '0 8px 24px rgba(124,58,237,0.4)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    {mode === 'login'  && 'Sign In'}
                    {mode === 'signup' && 'Create Account'}
                    {mode === 'reset'  && (resetSent ? 'Email Sent ✓' : 'Send Reset Email')}
                    {!resetSent && <ArrowRight size={18} />}
                  </>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            {mode !== 'reset' && (
              <>
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <span className="text-xs text-gray-600 font-medium">or continue with</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                </div>

                {/* Google button */}
                <motion.button
                  type="button"
                  onClick={handleGoogle}
                  disabled={googleLoading}
                  whileHover={{ scale: googleLoading ? 1 : 1.01 }}
                  whileTap={{ scale: googleLoading ? 1 : 0.98 }}
                  className="w-full flex items-center justify-center gap-3 rounded-2xl font-semibold transition-all"
                  style={{
                    minHeight: 52,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1.5px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.9)',
                    cursor: googleLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {googleLoading ? (
                    <Loader2 size={20} className="animate-spin text-gray-400" />
                  ) : (
                    <>
                      {/* Google SVG logo */}
                      <svg width="20" height="20" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google
                    </>
                  )}
                </motion.button>
              </>
            )}

            {/* Back to login (reset mode) */}
            {mode === 'reset' && (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full mt-4 text-sm text-gray-500 hover:text-gray-300 transition-colors font-medium"
                style={{ minHeight: 44, background: 'none', border: 'none' }}
              >
                ← Back to Sign In
              </button>
            )}

            {/* Terms */}
            {mode === 'signup' && (
              <p className="text-center text-xs text-gray-600 mt-4 leading-relaxed">
                By creating an account you agree to our{' '}
                <span className="text-violet-400 cursor-pointer hover:text-violet-300">Terms of Service</span>{' '}
                and{' '}
                <span className="text-violet-400 cursor-pointer hover:text-violet-300">Privacy Policy</span>.
              </p>
            )}
          </div>
        </div>

        {/* Bottom label */}
        <p className="text-center text-xs text-gray-700 mt-4">
          🔒 Secured by Firebase Authentication
        </p>
      </motion.div>
    </div>
  );
}
