import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Monitor, Check, Download } from 'lucide-react';
import { useStore, Currency, Theme, EXCHANGE_RATES } from '../store/useStore';
import PWAInstallButton from '../components/PWAInstallButton';

const currencies: { code: Currency; name: string; symbol: string; flag: string }[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'RSD', name: 'Serbian Dinar', symbol: 'din', flag: '🇷🇸' },
  { code: 'BTC', name: 'Bitcoin', symbol: '₿', flag: '₿' },
];

const themes: { value: Theme; icon: React.ComponentType<{ size?: number; className?: string }>; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'system', icon: Monitor, label: 'System' },
];

export default function Settings() {
  const { theme, currency, setCurrency, setTheme, transactions, wallets, goals, profile } = useStore();
  const isDark = theme === 'dark';

  const handleExport = () => {
    const data = { profile, wallets, transactions, goals };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financeflow-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Currency', 'Tags'];
    const rows = transactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.type, t.category, t.description,
      t.amount, t.currency, t.tags.join(';'),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-5 md:py-8 space-y-5 relative z-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Customize your experience</p>
      </motion.div>

      {/* ── PWA Install ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">📲</span>
          <h2 className="font-bold text-base">Install App</h2>
        </div>
        <PWAInstallButton isDark={isDark} variant="card" />
      </motion.div>

      {/* ── Theme ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className={`rounded-3xl p-5 ${isDark ? 'bg-gray-900/80 border border-gray-800' : 'bg-white/80 border border-gray-200'} backdrop-blur-xl shadow-xl`}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🎨</span>
          <h2 className="font-bold">Theme</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {themes.map(({ value, icon: Icon, label }) => (
            <motion.button
              key={value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setTheme(value)}
              style={{ minHeight: 72 }}
              className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all ${
                theme === value
                  ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                  : isDark
                    ? 'border-gray-700 text-gray-400 hover:border-gray-600'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <Icon size={20} />
              <span className="text-sm font-medium">{label}</span>
              {theme === value && <Check size={14} className="text-violet-400" />}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ── Currency ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className={`rounded-3xl p-5 ${isDark ? 'bg-gray-900/80 border border-gray-800' : 'bg-white/80 border border-gray-200'} backdrop-blur-xl shadow-xl`}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">💱</span>
          <h2 className="font-bold">Display Currency</h2>
        </div>
        <div className="space-y-2">
          {currencies.map(c => (
            <motion.button
              key={c.code}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrency(c.code)}
              style={{ minHeight: 52 }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all ${
                currency === c.code
                  ? 'border-violet-500 bg-violet-500/10'
                  : isDark
                    ? 'border-gray-800 hover:border-gray-700'
                    : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <span className="text-xl">{c.flag}</span>
              <div className="flex-1 text-left">
                <p className="font-medium text-sm">{c.name}</p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {c.symbol} · 1 USD = {c.code === 'USD' ? '1' : c.code === 'BTC' ? EXCHANGE_RATES[c.code].toFixed(6) : EXCHANGE_RATES[c.code].toFixed(2)} {c.code}
                </p>
              </div>
              {currency === c.code && <Check size={16} className="text-violet-400 flex-shrink-0" />}
            </motion.button>
          ))}
        </div>
        <div className={`mt-4 p-3 rounded-2xl ${isDark ? 'bg-violet-900/20 border border-violet-500/20' : 'bg-violet-50 border border-violet-200'}`}>
          <p className={`text-xs ${isDark ? 'text-violet-300' : 'text-violet-700'}`}>
            💡 Exchange rates are approximate. Real-time rates may differ.
          </p>
        </div>
      </motion.div>

      {/* ── Data Export ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className={`rounded-3xl p-5 ${isDark ? 'bg-gray-900/80 border border-gray-800' : 'bg-white/80 border border-gray-200'} backdrop-blur-xl shadow-xl`}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">📦</span>
          <h2 className="font-bold">Data Export</h2>
        </div>
        <div className="space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={handleExportCSV}
            style={{ minHeight: 52 }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all ${isDark ? 'border-gray-700 hover:border-emerald-500/50 hover:bg-emerald-500/5' : 'border-gray-200 hover:border-emerald-400 hover:bg-emerald-50'}`}
          >
            <Download size={18} className="text-emerald-400" />
            <div className="flex-1 text-left">
              <p className="font-medium text-sm">Export Transactions (CSV)</p>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{transactions.length} transactions</p>
            </div>
            <span className="text-xs font-semibold text-emerald-400">.CSV</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={handleExport}
            style={{ minHeight: 52 }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all ${isDark ? 'border-gray-700 hover:border-blue-500/50 hover:bg-blue-500/5' : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'}`}
          >
            <Download size={18} className="text-blue-400" />
            <div className="flex-1 text-left">
              <p className="font-medium text-sm">Export All Data (JSON)</p>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Wallets, goals and transactions</p>
            </div>
            <span className="text-xs font-semibold text-blue-400">.JSON</span>
          </motion.button>
        </div>
      </motion.div>

      {/* ── About ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className={`rounded-3xl p-5 ${isDark ? 'bg-gray-900/80 border border-gray-800' : 'bg-white/80 border border-gray-200'} backdrop-blur-xl shadow-xl`}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">ℹ️</span>
          <h2 className="font-bold">About FinanceFlow</h2>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Version', value: '1.0.0 Pro' },
            { label: 'Total Transactions', value: transactions.length.toString() },
            { label: 'Active Goals', value: goals.filter(g => g.status === 'active').length.toString() },
            { label: 'Wallets', value: wallets.length.toString() },
          ].map(({ label, value }) => (
            <div key={label} className={`flex justify-between py-2 border-b last:border-0 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{label}</span>
              <span className="text-sm font-semibold">{value}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
