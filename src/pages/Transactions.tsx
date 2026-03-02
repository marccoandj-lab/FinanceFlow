import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Trash2, TrendingUp, TrendingDown, Plus, X } from 'lucide-react';
import { useStore, formatCurrency, convertCurrency } from '../store/useStore';
import { format } from 'date-fns';
import QuickAddModal from '../components/QuickAddModal';

export default function Transactions() {
  const { transactions, categories, wallets, currency, deleteTransaction, theme } = useStore();
  const isDark = theme === 'dark';

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCat, setFilterCat] = useState('all');
  const [showModal, setShowModal] = useState<'income' | 'expense' | null>(null);

  const filtered = transactions.filter(t => {
    const matchSearch =
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    const matchType = filterType === 'all' || t.type === filterType;
    const matchCat = filterCat === 'all' || t.category === filterCat;
    return matchSearch && matchType && matchCat;
  });

  const getCat = (id: string) => categories.find(c => c.id === id);

  const grouped: Record<string, typeof filtered> = {};
  filtered.forEach(t => {
    const key = format(new Date(t.date), 'yyyy-MM-dd');
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(t);
  });
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const totalIncome = filtered.filter(t => t.type === 'income')
    .reduce((s, t) => s + convertCurrency(t.amount, t.currency, currency), 0);
  const totalExpense = filtered.filter(t => t.type === 'expense')
    .reduce((s, t) => s + convertCurrency(t.amount, t.currency, currency), 0);

  const hasTransactions = transactions.length > 0;
  const visibleCats = categories.filter(c => filterType === 'all' || c.type === filterType);

  return (
    <div className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-5 md:py-8 space-y-4 sm:space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-3"
      >
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">Transactions</h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {hasTransactions ? `${filtered.length} of ${transactions.length} records` : 'No records yet'}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal('income')}
            style={{ minHeight: 44, minWidth: 44 }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-sm font-semibold border border-emerald-500/20"
          >
            <Plus size={15} />
            <span className="hidden sm:inline text-xs">Income</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal('expense')}
            style={{ minHeight: 44, minWidth: 44 }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 text-red-400 text-sm font-semibold border border-red-500/20"
          >
            <Plus size={15} />
            <span className="hidden sm:inline text-xs">Expense</span>
          </motion.button>
        </div>
      </motion.div>

      {/* ── Empty state ────────────────────────────────────────────────────── */}
      {!hasTransactions ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-3xl p-8 sm:p-10 text-center ${isDark ? 'bg-gray-900/60 border border-gray-800' : 'bg-white/60 border border-gray-100'} backdrop-blur-xl`}
        >
          <div className="text-6xl mb-4">💸</div>
          <h2 className="text-xl font-bold mb-2">No transactions yet</h2>
          <p className={`text-sm mb-6 max-w-xs mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Track every euro and cent. Start by logging your salary, a bill, or any payment.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowModal('income')}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20"
            >
              <TrendingUp size={16} /> Add First Income
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowModal('expense')}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm border ${isDark ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-700'}`}
            >
              <TrendingDown size={16} /> Add First Expense
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <>
          {/* ── Summary cards ─────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 gap-3"
          >
            <div className={`rounded-2xl p-4 ${isDark ? 'bg-emerald-900/20 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'}`}>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={13} className="text-emerald-400 flex-shrink-0" />
                <span className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {filterType === 'income' ? 'Filtered Income' : 'Total Income'}
                </span>
              </div>
              <p className="font-bold text-emerald-400 text-sm sm:text-base">{formatCurrency(totalIncome, currency)}</p>
            </div>
            <div className={`rounded-2xl p-4 ${isDark ? 'bg-red-900/20 border border-red-500/20' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown size={13} className="text-red-400 flex-shrink-0" />
                <span className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {filterType === 'expense' ? 'Filtered Expenses' : 'Total Expenses'}
                </span>
              </div>
              <p className="font-bold text-red-400 text-sm sm:text-base">{formatCurrency(totalExpense, currency)}</p>
            </div>
          </motion.div>

          {/* ── Search ────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.14 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${isDark ? 'bg-gray-900/80 border border-gray-800' : 'bg-white/80 border border-gray-200'}`}
            style={{ minHeight: 48 }}
          >
            <Search size={15} className={`flex-shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search transactions..."
              className={`flex-1 bg-transparent outline-none text-sm min-w-0 ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
              style={{ fontSize: 16 }} /* prevent iOS zoom */
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ minHeight: 'unset', minWidth: 'unset' }}
                className="flex-shrink-0 p-1"
              >
                <X size={14} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
              </button>
            )}
          </motion.div>

          {/* ── Type filters ──────────────────────────────────────────────── */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
            {(['all', 'income', 'expense'] as const).map(type => (
              <motion.button
                key={type}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterType(type)}
                style={{ minHeight: 40, minWidth: 'unset', flexShrink: 0 }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
                  filterType === type
                    ? type === 'income'
                      ? 'bg-emerald-500 text-white'
                      : type === 'expense'
                        ? 'bg-red-500 text-white'
                        : 'bg-gradient-to-r from-violet-600 to-blue-600 text-white'
                    : isDark
                      ? 'bg-gray-900/80 text-gray-400 border border-gray-800'
                      : 'bg-white/80 text-gray-600 border border-gray-200'
                }`}
              >
                {type === 'all' ? 'All' : type === 'income' ? '↑ Income' : '↓ Expenses'}
              </motion.button>
            ))}
          </div>

          {/* ── Category filters ──────────────────────────────────────────── */}
          {visibleCats.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterCat('all')}
                style={{ minHeight: 40, minWidth: 'unset', flexShrink: 0 }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  filterCat === 'all'
                    ? 'bg-violet-600 text-white'
                    : isDark ? 'bg-gray-900/80 text-gray-400 border border-gray-800' : 'bg-white/80 text-gray-600 border border-gray-200'
                }`}
              >
                All
              </motion.button>
              {visibleCats.map(cat => (
                <motion.button
                  key={cat.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilterCat(cat.id)}
                  style={{
                    minHeight: 40, minWidth: 'unset', flexShrink: 0,
                    backgroundColor: filterCat === cat.id ? cat.color : undefined,
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    filterCat === cat.id
                      ? 'text-white'
                      : isDark ? 'bg-gray-900/80 text-gray-400 border border-gray-800' : 'bg-white/80 text-gray-600 border border-gray-200'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span className="hidden sm:inline">{cat.name}</span>
                </motion.button>
              ))}
            </div>
          )}

          {/* ── Transaction list ──────────────────────────────────────────── */}
          {sortedDates.length > 0 ? (
            <div className="space-y-5">
              {sortedDates.map((date, di) => (
                <motion.div
                  key={date}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: di * 0.05 }}
                >
                  {/* Date header */}
                  <div className="flex items-center justify-between mb-2 px-1">
                    <p className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {format(new Date(date + 'T12:00:00'), 'EEE, MMM d')}
                    </p>
                    <div className="flex gap-2 text-xs">
                      {grouped[date].some(t => t.type === 'income') && (
                        <span className="text-emerald-400 font-semibold">
                          +{formatCurrency(
                            grouped[date].filter(t => t.type === 'income')
                              .reduce((s, t) => s + convertCurrency(t.amount, t.currency, currency), 0),
                            currency
                          )}
                        </span>
                      )}
                      {grouped[date].some(t => t.type === 'expense') && (
                        <span className="text-red-400 font-semibold">
                          -{formatCurrency(
                            grouped[date].filter(t => t.type === 'expense')
                              .reduce((s, t) => s + convertCurrency(t.amount, t.currency, currency), 0),
                            currency
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Transaction cards */}
                  <div className={`rounded-3xl overflow-hidden ${isDark ? 'bg-gray-900/80 border border-gray-800' : 'bg-white/80 border border-gray-200'} backdrop-blur-xl`}>
                    {grouped[date].map((tx, i) => {
                      const cat = getCat(tx.category);
                      const wallet = wallets.find(w => w.id === tx.walletId);
                      return (
                        <motion.div
                          key={tx.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`flex items-center gap-3 px-4 py-3 ${i < grouped[date].length - 1 ? isDark ? 'border-b border-gray-800' : 'border-b border-gray-100' : ''}`}
                        >
                          <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
                            style={{ backgroundColor: (cat?.color || '#6b7280') + '22' }}
                          >
                            {cat?.icon || '💸'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {tx.description || cat?.name}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                              <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {cat?.name}
                              </span>
                              {wallet && (
                                <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                  · {wallet.icon} {wallet.name}
                                </span>
                              )}
                              {tx.tags.slice(0, 1).map(tag => (
                                <span
                                  key={tag}
                                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="text-right">
                              <p className={`font-bold text-sm ${tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                                {tx.type === 'income' ? '+' : '-'}
                                {formatCurrency(convertCurrency(tx.amount, tx.currency, currency), currency)}
                              </p>
                              <p className={`text-[11px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {format(new Date(tx.date), 'h:mm a')}
                              </p>
                            </div>
                            <motion.button
                              whileTap={{ scale: 0.88 }}
                              onClick={() => deleteTransaction(tx.id)}
                              style={{ minHeight: 36, minWidth: 36 }}
                              className={`rounded-xl flex items-center justify-center transition-colors ${isDark ? 'text-gray-600 hover:text-red-400 hover:bg-red-400/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                            >
                              <Trash2 size={14} />
                            </motion.button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`rounded-3xl p-10 text-center ${isDark ? 'bg-gray-900/60 border border-gray-800' : 'bg-white/60 border border-gray-100'} backdrop-blur-xl`}
            >
              <div className="text-5xl mb-3">🔍</div>
              <p className="font-bold text-base mb-1">No results found</p>
              <p className={`text-sm mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Try adjusting your filters or search term
              </p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => { setSearch(''); setFilterType('all'); setFilterCat('all'); }}
                style={{ minHeight: 44, minWidth: 'unset' }}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
              >
                Clear Filters
              </motion.button>
            </motion.div>
          )}
        </>
      )}

      <AnimatePresence>
        {showModal && <QuickAddModal type={showModal} onClose={() => setShowModal(null)} />}
      </AnimatePresence>
    </div>
  );
}
