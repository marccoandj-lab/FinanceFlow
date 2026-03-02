import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Minus, TrendingUp, TrendingDown, ArrowRight,
  Target, Wallet, PlusCircle, CheckCircle2,
} from 'lucide-react';
import { useStore, formatCurrency, convertCurrency } from '../store/useStore';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { format, subDays } from 'date-fns';
import QuickAddModal from '../components/QuickAddModal';
import { Link } from 'react-router-dom';

/* ── Animated balance counter ─────────────────────────────────────────────── */
function AnimatedCounter({ value, currency }: { value: number; currency: string }) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const start = prev.current;
    const end = value;
    const duration = 700;
    const startTime = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setDisplay(start + (end - start) * ease);
      if (p < 1) requestAnimationFrame(tick);
      else prev.current = end;
    };
    requestAnimationFrame(tick);
  }, [value]);
  const fmt = (n: number) => {
    if (currency === 'BTC') return `₿${n.toFixed(6)}`;
    if (currency === 'RSD') return `${Math.round(n).toLocaleString()} din`;
    const sym: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' };
    return `${sym[currency] || '$'}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  return <span>{fmt(display)}</span>;
}

/* ── Toast after adding a transaction ────────────────────────────────────── */
function AddedToast({ tx }: { tx: { type: string; amount: number; category: string } | null }) {
  const { theme, categories, currency, lastGoalUpdates } = useStore();
  const isDark = theme === 'dark';
  if (!tx) return null;
  const cat = categories.find(c => c.id === tx.category);
  return (
    <motion.div
      initial={{ opacity: 0, y: 48, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 48, scale: 0.92 }}
      transition={{ type: 'spring', damping: 22, stiffness: 300 }}
      className={`
        fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50
        flex flex-col gap-2 px-4 py-3 rounded-2xl shadow-2xl border
        w-[min(320px,90vw)]
        ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}
      `}
    >
      <div className="flex items-center gap-3">
        <CheckCircle2 size={18} className={tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'} />
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currency as Parameters<typeof formatCurrency>[1])} added
          </p>
          <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {cat?.icon} {cat?.name} · Wallet & goals updated
          </p>
        </div>
      </div>
      {lastGoalUpdates.length > 0 && (
        <div className={`rounded-xl p-2 space-y-1 ${isDark ? 'bg-violet-500/10 border border-violet-500/20' : 'bg-violet-50 border border-violet-100'}`}>
          {lastGoalUpdates.slice(0, 3).map(upd => (
            <div key={upd.goalId} className="flex items-center justify-between text-xs gap-2">
              <span className={`flex items-center gap-1 min-w-0 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <span>⚡</span>
                <span className="truncate">{upd.goalIcon} {upd.goalName}</span>
                {upd.justCompleted && ' 🎉'}
              </span>
              <span className="text-violet-400 font-bold flex-shrink-0">
                +{formatCurrency(upd.contributedAmount, currency as Parameters<typeof formatCurrency>[1])}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ── Empty state card ────────────────────────────────────────────────────── */
function EmptyCard({
  icon, title, subtitle, actionLabel, actionTo, onAction,
}: {
  icon: React.ReactNode; title: string; subtitle: string;
  actionLabel?: string; actionTo?: string; onAction?: () => void;
}) {
  const { theme } = useStore();
  const isDark = theme === 'dark';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl p-8 text-center ${isDark ? 'bg-gray-900/60 border border-gray-800' : 'bg-white/60 border border-gray-100'} backdrop-blur-xl`}
    >
      <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
        {icon}
      </div>
      <p className="font-bold text-sm mb-1">{title}</p>
      <p className={`text-xs mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{subtitle}</p>
      {actionLabel && actionTo && (
        <Link to={actionTo}>
          <motion.button
            whileTap={{ scale: 0.96 }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold text-sm shadow-lg shadow-violet-500/20"
          >
            {actionLabel}
          </motion.button>
        </Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onAction}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold text-sm shadow-lg shadow-violet-500/20"
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
}

/* ── Dashboard ────────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const { transactions, goals, wallets, categories, currency, theme, profile } = useStore();
  const isDark = theme === 'dark';

  const [showModal, setShowModal] = useState<'income' | 'expense' | null>(null);
  const [lastTx, setLastTx] = useState<{ type: string; amount: number; category: string } | null>(null);
  const prevTxCount = useRef(transactions.length);

  useEffect(() => {
    if (transactions.length > prevTxCount.current) {
      const newest = transactions[0];
      setLastTx({ type: newest.type, amount: newest.amount, category: newest.category });
      const t = setTimeout(() => setLastTx(null), 3500);
      prevTxCount.current = transactions.length;
      return () => clearTimeout(t);
    }
    prevTxCount.current = transactions.length;
  }, [transactions]);

  /* ── Derived values ─────────────────────────────────────────────────────── */
  const totalBalance = wallets.reduce(
    (sum, w) => sum + convertCurrency(w.balance, w.currency, currency), 0
  );
  const now = new Date();
  const thisMonth = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthIncome = thisMonth.filter(t => t.type === 'income')
    .reduce((s, t) => s + convertCurrency(t.amount, t.currency, currency), 0);
  const monthExpense = thisMonth.filter(t => t.type === 'expense')
    .reduce((s, t) => s + convertCurrency(t.amount, t.currency, currency), 0);

  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(now, 6 - i);
    const dayTxs = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getDate() === date.getDate() &&
        d.getMonth() === date.getMonth() &&
        d.getFullYear() === date.getFullYear();
    });
    const income = dayTxs.filter(t => t.type === 'income')
      .reduce((s, t) => s + convertCurrency(t.amount, t.currency, currency), 0);
    const expense = dayTxs.filter(t => t.type === 'expense')
      .reduce((s, t) => s + convertCurrency(t.amount, t.currency, currency), 0);
    return { day: format(date, 'EEE'), income, expense };
  });
  const hasChartData = chartData.some(d => d.income > 0 || d.expense > 0);

  const recentTxs = transactions.slice(0, 5);
  const activeGoals = goals.filter(g => g.status === 'active').slice(0, 3);
  const getCat = (id: string) => categories.find(c => c.id === id);

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };

  return (
    <div className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-5 md:py-8 space-y-5 md:space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-3"
      >
        <div className="min-w-0">
          <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {greeting()} {profile.name ? `👋 ${profile.name.split(' ')[0]}` : '👋'}
          </p>
          <h1 className="text-xl sm:text-2xl font-bold truncate">Dashboard</h1>
        </div>
        <motion.span
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
          className="text-3xl flex-shrink-0 select-none"
          aria-hidden
        >
          💰
        </motion.span>
      </motion.div>

      {/* ── Balance Card ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.08 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-violet-700 to-blue-700 p-5 sm:p-7 shadow-2xl shadow-violet-500/30"
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 40%, #a78bfa 0%, transparent 60%)' }}
        />
        <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -right-4 top-16 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-violet-200 text-sm font-medium">Total Balance</p>
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-emerald-400"
              title="Live sync"
            />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-5 leading-none">
            <AnimatedCounter value={totalBalance} currency={currency} />
          </h2>

          {/* Stats row — wraps on very small screens */}
          <div className="flex flex-wrap gap-x-5 gap-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp size={13} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-violet-300 text-[11px]">Month income</p>
                <p className="text-white font-semibold text-sm">{formatCurrency(monthIncome, currency)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <TrendingDown size={13} className="text-red-400" />
              </div>
              <div>
                <p className="text-violet-300 text-[11px]">Month expenses</p>
                <p className="text-white font-semibold text-sm">{formatCurrency(monthExpense, currency)}</p>
              </div>
            </div>
            {wallets.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Wallet size={13} className="text-blue-300" />
                </div>
                <div>
                  <p className="text-violet-300 text-[11px]">Wallets</p>
                  <p className="text-white font-semibold text-sm">
                    {wallets.length} account{wallets.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Quick Actions ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
        className="grid grid-cols-3 gap-2 sm:gap-3"
      >
        {[
          {
            label: 'Add Income', icon: Plus,
            color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/30',
            action: () => setShowModal('income'),
          },
          {
            label: 'Add Expense', icon: Minus,
            color: 'from-red-500 to-rose-600', shadow: 'shadow-red-500/30',
            action: () => setShowModal('expense'),
          },
          {
            label: 'New Goal', icon: Target,
            color: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/30',
            link: '/goals',
          },
        ].map(({ label, icon: Icon, color, shadow, action, link }) =>
          link ? (
            <Link key={label} to={link} className="block" style={{ minHeight: 'unset', minWidth: 'unset' }}>
              <motion.div
                whileTap={{ scale: 0.94 }}
                className={`flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-2xl bg-gradient-to-br ${color} shadow-lg ${shadow} text-white cursor-pointer`}
                style={{ minHeight: 76 }}
              >
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Icon size={17} />
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-center leading-tight">{label}</span>
              </motion.div>
            </Link>
          ) : (
            <motion.button
              key={label}
              whileTap={{ scale: 0.94 }}
              onClick={action!}
              style={{ minHeight: 76 }}
              className={`flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-2xl bg-gradient-to-br ${color} shadow-lg ${shadow} text-white w-full`}
            >
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Icon size={17} />
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-center leading-tight">{label}</span>
            </motion.button>
          )
        )}
      </motion.div>

      {/* ── 7-Day Chart ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`rounded-3xl p-4 sm:p-5 ${isDark ? 'bg-gray-900/80 border border-gray-800' : 'bg-white/80 border border-gray-200'} backdrop-blur-xl shadow-xl`}
      >
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-sm sm:text-base">7-Day Overview</h3>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Income vs Expenses</p>
          </div>
          <div className="flex gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Income
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Expense
            </span>
          </div>
        </div>
        {hasChartData ? (
          <div className="w-full overflow-hidden" style={{ touchAction: 'pan-y' }}>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="dash-inc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="dash-exp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false}
                  tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: isDark ? '#1f2937' : '#fff',
                    border: 'none', borderRadius: 12,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.25)', fontSize: 12,
                  }}
                  labelStyle={{ color: isDark ? '#e5e7eb' : '#374151', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fill="url(#dash-inc)" name="Income" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fill="url(#dash-exp)" name="Expense" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className={`h-36 flex flex-col items-center justify-center gap-2 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
            <span className="text-3xl">📊</span>
            <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No data yet</p>
            <p className={`text-xs text-center px-6 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              Add your first transaction to see activity
            </p>
          </div>
        )}
      </motion.div>

      {/* ── Active Goals ──────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm sm:text-base">Active Goals</h3>
          <Link to="/goals" style={{ minHeight: 'unset', minWidth: 'unset' }}>
            <motion.span
              whileTap={{ scale: 0.95 }}
              className={`text-xs flex items-center gap-1 px-3 py-2 rounded-xl ${isDark ? 'text-violet-400 hover:bg-violet-400/10' : 'text-violet-600 hover:bg-violet-50'}`}
            >
              View all <ArrowRight size={12} />
            </motion.span>
          </Link>
        </div>

        {activeGoals.length > 0 ? (
          <div className="space-y-3">
            {activeGoals.map((goal, i) => {
              const pct = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className={`rounded-2xl p-4 ${isDark ? 'bg-gray-900/80 border border-gray-800' : 'bg-white/80 border border-gray-200'} backdrop-blur-xl`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl flex-shrink-0">{goal.icon}</span>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{goal.name}</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatCurrency(goal.currentAmount, currency)} / {formatCurrency(goal.targetAmount, currency)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-bold text-base" style={{ color: goal.color }}>{pct}%</span>
                      <Link to="/goals" style={{ minHeight: 'unset', minWidth: 'unset' }}>
                        <span
                          className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold cursor-pointer ${isDark ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'}`}
                        >
                          View
                        </span>
                      </Link>
                    </div>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, delay: 0.4 + i * 0.1, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${goal.color}, ${goal.color}bb)` }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <EmptyCard
            icon={<Target size={22} className={isDark ? 'text-gray-600' : 'text-gray-400'} />}
            title="No goals yet"
            subtitle="Set a savings target and every transaction funds it automatically"
            actionLabel="Create First Goal"
            actionTo="/goals"
          />
        )}
      </motion.div>

      {/* ── Recent Transactions ───────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm sm:text-base">Recent Transactions</h3>
          <Link to="/transactions" style={{ minHeight: 'unset', minWidth: 'unset' }}>
            <motion.span
              whileTap={{ scale: 0.95 }}
              className={`text-xs flex items-center gap-1 px-3 py-2 rounded-xl ${isDark ? 'text-violet-400 hover:bg-violet-400/10' : 'text-violet-600 hover:bg-violet-50'}`}
            >
              View all <ArrowRight size={12} />
            </motion.span>
          </Link>
        </div>

        {recentTxs.length > 0 ? (
          <div className={`rounded-3xl overflow-hidden ${isDark ? 'bg-gray-900/80 border border-gray-800' : 'bg-white/80 border border-gray-200'} backdrop-blur-xl`}>
            <AnimatePresence initial={false}>
              {recentTxs.map((tx, i) => {
                const cat = getCat(tx.category);
                const wallet = wallets.find(w => w.id === tx.walletId);
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -16, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`flex items-center gap-3 px-4 py-3 ${i < recentTxs.length - 1 ? isDark ? 'border-b border-gray-800' : 'border-b border-gray-100' : ''}`}
                  >
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ backgroundColor: (cat?.color || '#6b7280') + '22' }}
                    >
                      {cat?.icon || '💸'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{tx.description || cat?.name}</p>
                      <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {cat?.name} · {format(new Date(tx.date), 'MMM d')}
                        {wallet && <span className="opacity-60"> · {wallet.icon} {wallet.name}</span>}
                      </p>
                    </div>
                    <p className={`font-bold text-sm flex-shrink-0 ${tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(convertCurrency(tx.amount, tx.currency, currency), currency)}
                    </p>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <EmptyCard
            icon={<TrendingUp size={22} className={isDark ? 'text-gray-600' : 'text-gray-400'} />}
            title="No transactions yet"
            subtitle="Add income or expense to start tracking your finances"
            actionLabel="Add First Transaction"
            onAction={() => setShowModal('income')}
          />
        )}
      </motion.div>

      {/* ── Wallets summary ───────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm sm:text-base">My Wallets</h3>
          <Link to="/wallets" style={{ minHeight: 'unset', minWidth: 'unset' }}>
            <motion.span
              whileTap={{ scale: 0.95 }}
              className={`text-xs flex items-center gap-1 px-3 py-2 rounded-xl ${isDark ? 'text-violet-400 hover:bg-violet-400/10' : 'text-violet-600 hover:bg-violet-50'}`}
            >
              Manage <ArrowRight size={12} />
            </motion.span>
          </Link>
        </div>

        {wallets.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {wallets.map((w, i) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                className={`rounded-2xl p-4 ${isDark ? 'bg-gray-900/80 border border-gray-800' : 'bg-white/80 border border-gray-200'} backdrop-blur-xl`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{w.icon}</span>
                  <span className={`text-xs font-medium truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{w.name}</span>
                </div>
                <p className="font-bold text-sm sm:text-base">{formatCurrency(w.balance, w.currency)}</p>
                {w.currency !== currency && (
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    ≈ {formatCurrency(convertCurrency(w.balance, w.currency, currency), currency)}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyCard
            icon={<Wallet size={22} className={isDark ? 'text-gray-600' : 'text-gray-400'} />}
            title="No wallets set up"
            subtitle="Add a bank, cash, savings or crypto wallet"
            actionLabel="Add First Wallet"
            actionTo="/wallets"
          />
        )}
      </motion.div>

      {/* ── Smart tip ─────────────────────────────────────────────────────── */}
      {transactions.length >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.44 }}
          className="rounded-3xl p-5 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20"
        >
          <div className="flex items-start gap-3">
            <motion.span
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="text-2xl flex-shrink-0 select-none"
            >
              💡
            </motion.span>
            <div>
              <p className="font-semibold text-amber-400 text-sm">Smart Suggestion</p>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {monthIncome > 0
                  ? <>You could save <strong className="text-amber-400">{formatCurrency(monthIncome * 0.2, currency)}</strong> more this month — that's 20% of your income.</>
                  : <>Add your income sources so we can generate personalized savings suggestions.</>
                }
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── First-time CTA ────────────────────────────────────────────────── */}
      {transactions.length === 0 && wallets.length === 0 && goals.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.44 }}
          className="rounded-3xl p-6 bg-gradient-to-br from-violet-600/10 to-blue-600/10 border border-violet-500/20 text-center"
        >
          <div className="text-4xl mb-3">🌟</div>
          <h3 className="font-bold text-lg mb-2">Ready to take control?</h3>
          <p className={`text-sm mb-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Start by adding a wallet, then log your first income or expense.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/wallets" style={{ minHeight: 'unset', minWidth: 'unset', display: 'block' }}>
              <motion.button
                whileTap={{ scale: 0.96 }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold text-sm shadow-lg"
              >
                <PlusCircle size={15} /> Add Wallet
              </motion.button>
            </Link>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowModal('income')}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm border ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              <Plus size={15} /> Log Income
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && <QuickAddModal type={showModal} onClose={() => setShowModal(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {lastTx && <AddedToast tx={lastTx} />}
      </AnimatePresence>
    </div>
  );
}
