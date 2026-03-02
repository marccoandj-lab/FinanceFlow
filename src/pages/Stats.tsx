import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { useStore, formatCurrency, convertCurrency } from '../store/useStore';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  Tooltip, XAxis, YAxis, ResponsiveContainer,
} from 'recharts';
import { format, subDays, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Link } from 'react-router-dom';

type Period = '7d' | '30d' | '3m' | '1y';

export default function Stats() {
  const { transactions, categories, currency, theme } = useStore();
  const isDark = theme === 'dark';
  const [period, setPeriod] = useState<Period>('30d');

  const now = new Date();
  const getStart = () => {
    if (period === '7d') return subDays(now, 7);
    if (period === '30d') return subDays(now, 30);
    if (period === '3m') return subMonths(now, 3);
    return subMonths(now, 12);
  };

  const filtered = transactions.filter(t => new Date(t.date) >= getStart());
  const income = filtered.filter(t => t.type === 'income')
    .reduce((s, t) => s + convertCurrency(t.amount, t.currency, currency), 0);
  const expense = filtered.filter(t => t.type === 'expense')
    .reduce((s, t) => s + convertCurrency(t.amount, t.currency, currency), 0);
  const savings = income - expense;

  /* Monthly trend — last 6 months */
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, 5 - i);
    const start = startOfMonth(d);
    const end = endOfMonth(d);
    const txs = transactions.filter(t => isWithinInterval(new Date(t.date), { start, end }));
    const inc = txs.filter(t => t.type === 'income').reduce((s, t) => s + convertCurrency(t.amount, t.currency, currency), 0);
    const exp = txs.filter(t => t.type === 'expense').reduce((s, t) => s + convertCurrency(t.amount, t.currency, currency), 0);
    return { month: format(d, 'MMM'), income: Math.round(inc), expense: Math.round(exp), savings: Math.round(inc - exp) };
  });

  /* Category breakdown */
  const catData = categories
    .filter(c => c.type === 'expense')
    .map(cat => {
      const total = filtered
        .filter(t => t.category === cat.id)
        .reduce((s, t) => s + convertCurrency(t.amount, t.currency, currency), 0);
      return { name: cat.name, value: Math.round(total), color: cat.color, icon: cat.icon };
    })
    .filter(c => c.value > 0)
    .sort((a, b) => b.value - a.value);

  /* Daily trend */
  const displayDays = period === '7d' ? 7 : 14;
  const dailyData = Array.from({ length: displayDays }, (_, i) => {
    const date = subDays(now, displayDays - 1 - i);
    const dayTxs = filtered.filter(t => {
      const d = new Date(t.date);
      return d.getDate() === date.getDate() &&
        d.getMonth() === date.getMonth() &&
        d.getFullYear() === date.getFullYear();
    });
    const inc = dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + convertCurrency(t.amount, t.currency, currency), 0);
    const exp = dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + convertCurrency(t.amount, t.currency, currency), 0);
    return { day: format(date, 'dd'), income: Math.round(inc), expense: Math.round(exp) };
  });

  const hasData = transactions.length > 0;
  const hasCatData = catData.length > 0;
  const hasMonthlyData = monthlyData.some(d => d.income > 0 || d.expense > 0);

  const sym = currency === 'RSD' ? 'din' : currency === 'BTC' ? '₿' :
    ({ USD: '$', EUR: '€', GBP: '£' } as Record<string, string>)[currency] || '$';

  const fmtTick = (v: number) =>
    v === 0 ? '0' : v >= 1000 ? `${sym}${(v / 1000).toFixed(0)}k` : `${sym}${v}`;

  const CustomTooltip = ({
    active, payload, label,
  }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className={`rounded-2xl p-3 shadow-2xl text-xs ${isDark ? 'bg-gray-800 border border-gray-700 text-white' : 'bg-white border border-gray-100 text-gray-900'}`}>
        <p className="font-semibold mb-1">{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: {formatCurrency(p.value, currency)}</p>
        ))}
      </div>
    );
  };

  /* ── Empty state ──────────────────────────────────────────────────────── */
  if (!hasData) {
    return (
      <div className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-5 md:py-8">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl sm:text-2xl font-bold">Analytics</h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Your financial insights</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={`mt-6 rounded-3xl p-8 sm:p-10 text-center ${isDark ? 'bg-gray-900/60 border border-gray-800' : 'bg-white/60 border border-gray-100'} backdrop-blur-xl`}
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl flex items-center justify-center bg-gradient-to-br from-violet-500/20 to-blue-500/20">
            <BarChart3 size={36} className="text-violet-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">No data to analyze yet</h2>
          <p className={`text-sm mb-6 max-w-xs mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Start adding income and expenses — your analytics will automatically appear here.
          </p>
          <Link to="/transactions" style={{ minHeight: 'unset', minWidth: 'unset', display: 'inline-block' }}>
            <motion.button
              whileTap={{ scale: 0.96 }}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-bold text-sm shadow-lg shadow-violet-500/20"
            >
              Add First Transaction
            </motion.button>
          </Link>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { label: 'Track Income', emoji: '📈', desc: 'Log salaries & freelance' },
              { label: 'Track Expenses', emoji: '📉', desc: 'Monitor your spending' },
              { label: 'See Trends', emoji: '📊', desc: 'Monthly & category reports' },
            ].map(({ label, emoji, desc }) => (
              <div key={label} className={`p-3 rounded-2xl ${isDark ? 'bg-gray-800/60' : 'bg-gray-50'}`}>
                <div className="text-2xl mb-1">{emoji}</div>
                <p className="font-semibold text-xs">{label}</p>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-5 md:py-8 space-y-5 md:space-y-6">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl sm:text-2xl font-bold">Analytics</h1>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Your financial insights</p>
      </motion.div>

      {/* Period filter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.08 }}
        className={`flex gap-1 p-1 rounded-2xl w-fit ${isDark ? 'bg-gray-900/80' : 'bg-gray-100'}`}
      >
        {(['7d', '30d', '3m', '1y'] as Period[]).map(p => (
          <motion.button
            key={p}
            whileTap={{ scale: 0.95 }}
            onClick={() => setPeriod(p)}
            style={{ minHeight: 'unset', minWidth: 'unset' }}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              period === p
                ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg'
                : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {p === '7d' ? '7D' : p === '30d' ? '30D' : p === '3m' ? '3M' : '1Y'}
          </motion.button>
        ))}
      </motion.div>

      {/* Summary cards */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
        className="grid grid-cols-3 gap-2 sm:gap-3"
      >
        {[
          { label: 'Income', value: income, color: 'from-emerald-500 to-teal-600', emoji: '📈' },
          { label: 'Expenses', value: expense, color: 'from-red-500 to-rose-600', emoji: '📉' },
          {
            label: 'Saved', value: savings,
            color: savings >= 0 ? 'from-violet-500 to-blue-600' : 'from-orange-500 to-red-600',
            emoji: savings >= 0 ? '💰' : '⚠️',
          },
        ].map(({ label, value, color, emoji }) => (
          <motion.div
            key={label}
            whileTap={{ scale: 0.97 }}
            className={`rounded-2xl p-3 sm:p-4 bg-gradient-to-br ${color} text-white shadow-lg`}
          >
            <p className="text-lg sm:text-2xl mb-1 select-none">{emoji}</p>
            <p className="text-[10px] sm:text-xs font-medium opacity-80">{label}</p>
            <p className="font-bold text-xs sm:text-sm mt-1 break-all">
              {formatCurrency(Math.abs(value), currency)}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Daily area chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`rounded-3xl p-4 sm:p-5 ${isDark ? 'bg-gray-900/80 border border-gray-800' : 'bg-white/80 border border-gray-200'} backdrop-blur-xl shadow-xl`}
      >
        <h3 className="font-bold mb-4 text-sm sm:text-base">Daily Cash Flow</h3>
        <div className="w-full overflow-hidden" style={{ touchAction: 'pan-y' }}>
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={dailyData} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="sg-inc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="sg-exp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false}
                tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 10 }}
                interval={period === '7d' ? 0 : 2} />
              <YAxis axisLine={false} tickLine={false}
                tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 10 }}
                width={44} tickFormatter={fmtTick} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fill="url(#sg-inc)" name="Income" />
              <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fill="url(#sg-exp)" name="Expense" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Monthly bar chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.26 }}
        className={`rounded-3xl p-4 sm:p-5 ${isDark ? 'bg-gray-900/80 border border-gray-800' : 'bg-white/80 border border-gray-200'} backdrop-blur-xl shadow-xl`}
      >
        <h3 className="font-bold mb-4 text-sm sm:text-base">Monthly Trends</h3>
        {hasMonthlyData ? (
          <div className="w-full overflow-hidden" style={{ touchAction: 'pan-y' }}>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={monthlyData} barCategoryGap="35%" margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
                <XAxis dataKey="month" axisLine={false} tickLine={false}
                  tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false}
                  tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 10 }}
                  width={44} tickFormatter={fmtTick} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[5, 5, 0, 0]} maxBarSize={32} />
                <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[5, 5, 0, 0]} maxBarSize={32} />
                <Bar dataKey="savings" name="Savings" fill="#8b5cf6" radius={[5, 5, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className={`h-[170px] flex items-center justify-center rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No monthly data yet</p>
          </div>
        )}
      </motion.div>

      {/* Category pie */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32 }}
        className={`rounded-3xl p-4 sm:p-5 ${isDark ? 'bg-gray-900/80 border border-gray-800' : 'bg-white/80 border border-gray-200'} backdrop-blur-xl shadow-xl`}
      >
        <h3 className="font-bold mb-4 text-sm sm:text-base">Expense Breakdown</h3>
        {hasCatData ? (
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center">
            {/* Pie — fixed size so it never overflows */}
            <div className="flex-shrink-0 w-[160px] h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={catData} cx="50%" cy="50%"
                    innerRadius={44} outerRadius={72}
                    paddingAngle={3} dataKey="value"
                  >
                    {catData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: unknown) => formatCurrency(Number(v), currency)}
                    contentStyle={{
                      background: isDark ? '#1f2937' : '#fff',
                      border: 'none', borderRadius: 12, fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bars */}
            <div className="flex-1 w-full space-y-2 min-w-0">
              {catData.slice(0, 6).map((cat, i) => {
                const pct = expense > 0 ? Math.round((cat.value / expense) * 100) : 0;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.36 + i * 0.05 }}
                  >
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm flex-shrink-0">{cat.icon}</span>
                        <span className={`text-xs font-medium truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {cat.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{pct}%</span>
                        <span className="text-xs font-semibold" style={{ color: cat.color }}>
                          {formatCurrency(cat.value, currency)}
                        </span>
                      </div>
                    </div>
                    <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.4 + i * 0.05 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className={`h-28 flex flex-col items-center justify-center gap-2 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
            <span className="text-2xl">🍕</span>
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              No expense categories for this period
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
