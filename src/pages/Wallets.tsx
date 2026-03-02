import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowLeftRight, Trash2, TrendingUp, TrendingDown, ChevronDown, X } from 'lucide-react';
import { useStore, formatCurrency, convertCurrency, mkId, WalletType, Currency } from '../store/useStore';
import { useModalHeight } from '../hooks/useModalHeight';

const walletTypeOptions: { type: WalletType; icon: string; label: string }[] = [
  { type: 'bank',    icon: '🏦', label: 'Bank Account' },
  { type: 'cash',    icon: '💵', label: 'Cash'         },
  { type: 'savings', icon: '🐷', label: 'Savings'      },
  { type: 'crypto',  icon: '₿',  label: 'Crypto'       },
];

const walletColors: string[] = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];
const currencies: Currency[] = ['USD', 'EUR', 'GBP', 'RSD', 'BTC'];

type ModalType = 'add' | 'transfer' | null;

export default function Wallets() {
  const { wallets, transactions, currency, addWallet, deleteWallet, transferBetweenWallets, theme } = useStore();
  const isDark = theme === 'dark';

  const { portalPaddingBottom, sheetMaxH } = useModalHeight();

  const [openModal,      setOpenModal] = useState<ModalType>(null);
  const [expandedWallet, setExpanded]  = useState<string | null>(null);
  const [transfer, setTransfer]        = useState({ from: '', to: '', amount: '' });
  const [form, setForm] = useState({
    name: '', type: 'bank' as WalletType,
    balance: '', currency: 'USD' as Currency,
    color: '#3b82f6', icon: '🏦',
  });

  /* lock body scroll when modal open */
  useEffect(() => {
    if (openModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [openModal]);

  const totalMain = wallets.reduce((s, w) => s + convertCurrency(w.balance, w.currency, currency), 0);
  const totalUSD  = wallets.reduce((s, w) => s + convertCurrency(w.balance, w.currency, 'USD'), 0);

  const handleAddWallet = () => {
    const wt = walletTypeOptions.find(w => w.type === form.type);
    addWallet({
      id: mkId(), name: form.name, type: form.type,
      balance: parseFloat(form.balance) || 0,
      currency: form.currency, color: form.color,
      icon: wt?.icon || '💰',
    });
    setForm({ name: '', type: 'bank', balance: '', currency: 'USD', color: '#3b82f6', icon: '🏦' });
    setOpenModal(null);
  };

  const handleTransfer = () => {
    const amt = parseFloat(transfer.amount);
    if (!amt || !transfer.from || !transfer.to || transfer.from === transfer.to) return;
    transferBetweenWallets(transfer.from, transfer.to, amt);
    setTransfer({ from: '', to: '', amount: '' });
    setOpenModal(null);
  };

  const getWalletTxs   = (id: string) => transactions.filter(t => t.walletId === id).slice(0, 5);
  const getWalletStats = (id: string) => {
    const wt = transactions.filter(t => t.walletId === id);
    return {
      income:  wt.filter(t => t.type === 'income').reduce((s, t) => s + convertCurrency(t.amount, t.currency, currency), 0),
      expense: wt.filter(t => t.type === 'expense').reduce((s, t) => s + convertCurrency(t.amount, t.currency, currency), 0),
      count:   wt.length,
    };
  };

  const canAddWallet = !!form.name;
  const canTransfer  = !!transfer.from && !!transfer.to && !!transfer.amount
    && parseFloat(transfer.amount) > 0 && transfer.from !== transfer.to;

  /* shared colours */
  const bg         = isDark ? '#111827' : '#ffffff';
  const border     = isDark ? '1px solid #1f2937' : '1px solid #e5e7eb';
  const inputBg    = isDark ? '#1f2937' : '#f9fafb';
  const inputBdr   = isDark ? '#374151' : '#e5e7eb';
  const labelClr   = isDark ? '#9ca3af' : '#4b5563';
  const textClr    = isDark ? '#ffffff' : '#111827';
  const mutedClr   = isDark ? '#6b7280' : '#9ca3af';
  const dividerClr = isDark ? '#1f2937' : '#f3f4f6';

  const inp: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: 14,
    outline: 'none', border: `2px solid ${inputBdr}`,
    background: inputBg, color: textClr,
    fontSize: 16, fontFamily: 'inherit', boxSizing: 'border-box',
    appearance: 'none', WebkitAppearance: 'none',
  };

  /* sheetH and sheetBottom come from useModalHeight() above */

  /* ── Modal renderer ── */
  const renderModal = (type: 'add' | 'transfer') => {
    const isAdd      = type === 'add';
    const title      = isAdd ? '💳 Add Wallet' : '↔️ Transfer Funds';
    const canSubmit  = isAdd ? canAddWallet : canTransfer;
    const onSubmit   = isAdd ? handleAddWallet : handleTransfer;
    const submitText = isAdd ? 'Add Wallet' : 'Transfer';

    return (
      <motion.div
        key={`${type}-portal`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
          overflow: 'hidden',
          paddingBottom: portalPaddingBottom,
        }}
      >
        {/* Backdrop */}
        <div
          onClick={() => setOpenModal(null)}
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
        />

        {/* Sheet — 100% inline styles */}
        <motion.div
          key={`${type}-sheet`}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 32, stiffness: 340 }}
          onClick={e => e.stopPropagation()}
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            maxWidth: 520,
            maxHeight: sheetMaxH,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '28px 28px 0 0',
            overflow: 'hidden',
            boxShadow: '0 -8px 64px rgba(0,0,0,0.55)',
            background: bg,
            border,
          }}
        >
          {/* ━━━ HEADER (flex-shrink:0) ━━━ */}
          <div style={{ flexShrink: 0, flexGrow: 0, background: bg }}>
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4 }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: isDark ? '#374151' : '#d1d5db' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 20px 14px' }}>
              <h2 style={{ fontSize: 19, fontWeight: 700, margin: 0, color: textClr }}>{title}</h2>
              <button
                onClick={() => setOpenModal(null)}
                style={{
                  width: 40, height: 40, flexShrink: 0, borderRadius: 12,
                  border: 'none', cursor: 'pointer',
                  background: isDark ? '#1f2937' : '#f3f4f6',
                  color: mutedClr,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ height: 1, background: dividerClr }} />
          </div>

          {/* ━━━ BODY (flex:1, scrollable) ━━━ */}
          <div
            style={{
              flex: '1 1 0%',
              minHeight: 0,
              overflowY: 'scroll',
              overflowX: 'hidden',
              WebkitOverflowScrolling: 'touch' as never,
              overscrollBehavior: 'contain',
              padding: '16px 20px 8px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {isAdd ? (
                <>
                  {/* Name */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 7, color: labelClr }}>
                      Wallet Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Chase Bank"
                      autoFocus
                      style={inp}
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 7, color: labelClr }}>
                      Type
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {walletTypeOptions.map(wt => (
                        <button
                          key={wt.type}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, type: wt.type, icon: wt.icon }))}
                          style={{
                            height: 54, minHeight: 54, borderRadius: 14, border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px',
                            fontWeight: 500, fontSize: 14, fontFamily: 'inherit',
                            background: form.type === wt.type ? 'rgba(139,92,246,0.15)' : isDark ? '#1f2937' : '#f9fafb',
                            color: form.type === wt.type ? '#a78bfa' : mutedClr,
                            outline: form.type === wt.type ? '2px solid #7c3aed' : `2px solid ${inputBdr}`,
                            transition: 'all .15s',
                          }}
                        >
                          <span style={{ fontSize: 20 }}>{wt.icon}</span>
                          <span>{wt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Balance + Currency */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 7, color: labelClr }}>
                        Starting Balance
                      </label>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={form.balance}
                        onChange={e => setForm(f => ({ ...f, balance: e.target.value }))}
                        placeholder="0.00"
                        min="0" step="0.01"
                        style={inp}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 7, color: labelClr }}>
                        Currency
                      </label>
                      <select
                        value={form.currency}
                        onChange={e => setForm(f => ({ ...f, currency: e.target.value as Currency }))}
                        style={inp}
                      >
                        {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Color */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 7, color: labelClr }}>
                      Color
                    </label>
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                      {walletColors.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, color: c }))}
                          style={{
                            width: 42, height: 42, minHeight: 42, borderRadius: '50%', cursor: 'pointer',
                            backgroundColor: c, border: 'none',
                            outline: form.color === c ? '3px solid white' : '3px solid transparent',
                            outlineOffset: 2,
                            transform: form.color === c ? 'scale(1.2)' : 'scale(1)',
                            transition: 'all .15s',
                            boxShadow: form.color === c ? `0 0 0 2px ${c}` : 'none',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* From */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 7, color: labelClr }}>From</label>
                    <select
                      value={transfer.from}
                      onChange={e => setTransfer(t => ({ ...t, from: e.target.value }))}
                      style={inp}
                    >
                      <option value="">Select wallet</option>
                      {wallets.map(w => (
                        <option key={w.id} value={w.id}>{w.icon} {w.name} ({formatCurrency(w.balance, w.currency)})</option>
                      ))}
                    </select>
                  </div>

                  {/* Arrow */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 14,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isDark ? '#1f2937' : '#f3f4f6',
                    }}>
                      <ArrowLeftRight color="#a78bfa" size={20} />
                    </div>
                  </div>

                  {/* To */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 7, color: labelClr }}>To</label>
                    <select
                      value={transfer.to}
                      onChange={e => setTransfer(t => ({ ...t, to: e.target.value }))}
                      style={inp}
                    >
                      <option value="">Select wallet</option>
                      {wallets.filter(w => w.id !== transfer.from).map(w => (
                        <option key={w.id} value={w.id}>{w.icon} {w.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Amount */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 7, color: labelClr }}>Amount</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={transfer.amount}
                      onChange={e => setTransfer(t => ({ ...t, amount: e.target.value }))}
                      placeholder="0.00"
                      min="0.01" step="0.01"
                      style={inp}
                    />
                    {transfer.from && transfer.amount && (() => {
                      const fromW = wallets.find(w => w.id === transfer.from);
                      const after = fromW ? fromW.balance - parseFloat(transfer.amount) : 0;
                      return fromW ? (
                        <p style={{ fontSize: 12, marginTop: 6, color: after < 0 ? '#ef4444' : mutedClr }}>
                          {after < 0
                            ? `⚠️ Insufficient — missing ${formatCurrency(Math.abs(after), fromW.currency)}`
                            : `Balance after: ${formatCurrency(after, fromW.currency)}`}
                        </p>
                      ) : null;
                    })()}
                  </div>
                </>
              )}

              <div style={{ height: 4 }} />
            </div>
          </div>

          {/* ━━━ FOOTER (flex-shrink:0, ALWAYS VISIBLE) ━━━ */}
          <div
            style={{
              flexShrink: 0,
              flexGrow: 0,
              padding: '12px 20px',
              paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))',
              borderTop: `1px solid ${dividerClr}`,
              background: bg,
            }}
          >
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={() => setOpenModal(null)}
                style={{
                  flex: 1,
                  height: 54,
                  minHeight: 54,
                  borderRadius: 16,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 15,
                  fontFamily: 'inherit',
                  background: isDark ? '#1f2937' : '#f3f4f6',
                  color: isDark ? '#d1d5db' : '#374151',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSubmit}
                disabled={!canSubmit}
                style={{
                  flex: 2,
                  height: 54,
                  minHeight: 54,
                  borderRadius: 16,
                  border: 'none',
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  fontWeight: 700,
                  fontSize: 15,
                  fontFamily: 'inherit',
                  color: '#fff',
                  opacity: canSubmit ? 1 : 0.38,
                  background: 'linear-gradient(135deg,#7c3aed,#2563eb)',
                  boxShadow: canSubmit ? '0 4px 20px rgba(124,58,237,0.4)' : 'none',
                  transition: 'opacity .2s',
                }}
              >
                {submitText}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-5 md:py-8 space-y-5 md:space-y-6">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">Wallets</h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {wallets.length > 0 ? `${wallets.length} account${wallets.length !== 1 ? 's' : ''}` : 'No accounts yet'}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {wallets.length >= 2 && (
            <button
              onClick={() => setOpenModal('transfer')}
              style={{ minHeight: 44, height: 44 }}
              className={`flex items-center gap-1.5 px-3 rounded-xl text-sm font-semibold border ${isDark ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-700'}`}
            >
              <ArrowLeftRight size={14} />
              <span className="hidden sm:inline">Transfer</span>
            </button>
          )}
          <button
            onClick={() => setOpenModal('add')}
            style={{ minHeight: 44, height: 44 }}
            className="flex items-center gap-1.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-semibold shadow-lg shadow-violet-500/30"
          >
            <Plus size={14} /> Add Wallet
          </button>
        </div>
      </motion.div>

      {/* Net Worth card */}
      {wallets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.08 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-violet-700 to-blue-700 p-5 sm:p-7 shadow-2xl shadow-violet-500/30"
        >
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, #a78bfa 0%, transparent 60%)' }} />
          <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
          <div className="relative z-10">
            <p className="text-violet-200 text-sm font-medium">Total Net Worth</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-1">
              {formatCurrency(totalMain, currency)}
            </h2>
            <p className="text-violet-300 text-xs mt-2">
              {wallets.length} wallet{wallets.length !== 1 ? 's' : ''} · {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
            </p>
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {wallets.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl p-8 sm:p-10 text-center ${isDark ? 'bg-gray-900/60 border border-gray-800' : 'bg-white/60 border border-gray-100'} backdrop-blur-xl`}>
          <div className="text-6xl mb-4">💳</div>
          <h2 className="text-xl font-bold mb-2">No wallets yet</h2>
          <p className={`text-sm mb-6 max-w-xs mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Add your bank account, cash, savings or crypto wallet to track your net worth.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-sm mx-auto mb-6">
            {walletTypeOptions.map(opt => (
              <button
                key={opt.type}
                onClick={() => { setForm(f => ({ ...f, type: opt.type, icon: opt.icon })); setOpenModal('add'); }}
                style={{ minHeight: 72, height: 'auto' }}
                className={`p-3 rounded-2xl text-center border-2 border-dashed transition-all flex flex-col items-center justify-center gap-1 ${isDark ? 'border-gray-700 text-gray-400 hover:border-violet-500 hover:text-violet-400' : 'border-gray-200 text-gray-500 hover:border-violet-400 hover:text-violet-600'}`}
              >
                <span className="text-2xl">{opt.icon}</span>
                <p className="text-[11px] font-medium leading-tight">{opt.label}</p>
              </button>
            ))}
          </div>
          <button
            onClick={() => setOpenModal('add')}
            style={{ minHeight: 48, height: 48 }}
            className="px-6 rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-bold text-sm shadow-lg shadow-violet-500/20"
          >
            Add First Wallet
          </button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {wallets.map((w, i) => {
            const pct        = totalUSD > 0 ? (convertCurrency(w.balance, w.currency, 'USD') / totalUSD) * 100 : 0;
            const stats      = getWalletStats(w.id);
            const wTxs       = getWalletTxs(w.id);
            const isExpanded = expandedWallet === w.id;

            return (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className={`rounded-3xl overflow-hidden ${isDark ? 'bg-gray-900/80 border border-gray-800' : 'bg-white/80 border border-gray-200'} backdrop-blur-xl shadow-xl`}
              >
                <div
                  onClick={() => setExpanded(isExpanded ? null : w.id)}
                  className="p-4 sm:p-5 cursor-pointer select-none"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: w.color + '22' }}>
                      {w.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{w.name}</p>
                      <p className={`text-xs capitalize ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {w.type} · {w.currency}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={e => { e.stopPropagation(); deleteWallet(w.id); }}
                        style={{ width: 36, height: 36, minWidth: 36, minHeight: 36 }}
                        className={`rounded-xl flex items-center justify-center transition-colors ${isDark ? 'text-gray-600 hover:text-red-400 hover:bg-red-400/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                      >
                        <Trash2 size={14} />
                      </button>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className={`w-6 h-6 flex items-center justify-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
                      >
                        <ChevronDown size={16} />
                      </motion.div>
                    </div>
                  </div>

                  <p className="text-2xl font-bold">{formatCurrency(w.balance, w.currency)}</p>
                  {w.currency !== currency && (
                    <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      ≈ {formatCurrency(convertCurrency(w.balance, w.currency, currency), currency)}
                    </p>
                  )}

                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Portfolio share</span>
                      <span style={{ color: w.color }}>{pct.toFixed(1)}%</span>
                    </div>
                    <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: w.color }}
                      />
                    </div>
                  </div>

                  {stats.count > 0 && (
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp size={11} className="text-emerald-400" />
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatCurrency(stats.income, currency)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <TrendingDown size={11} className="text-red-400" />
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatCurrency(stats.expense, currency)}
                        </span>
                      </div>
                      <span className={`text-xs ml-auto ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                        {stats.count} tx · tap to {isExpanded ? 'collapse' : 'expand'}
                      </span>
                    </div>
                  )}
                </div>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      key="expanded"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className={`border-t ${isDark ? 'border-gray-800' : 'border-gray-100'} px-4 sm:px-5 py-4`}>
                        <p className={`text-xs font-semibold mb-3 uppercase tracking-wide ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          Recent Activity
                        </p>
                        {wTxs.length > 0 ? (
                          <div className="space-y-2.5">
                            {wTxs.map(tx => {
                              const cat = useStore.getState().categories.find(c => c.id === tx.category);
                              return (
                                <div key={tx.id} className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ backgroundColor: (cat?.color || '#6b7280') + '22' }}>
                                    {cat?.icon || '💸'}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">{tx.description || cat?.name}</p>
                                    <p className={`text-[11px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                      {new Date(tx.date).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <p className={`text-xs font-bold flex-shrink-0 ${tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, tx.currency)}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className={`text-sm text-center py-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            No transactions yet for this wallet
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {openModal === 'add'      && renderModal('add')}
        {openModal === 'transfer' && renderModal('transfer')}
      </AnimatePresence>
    </div>
  );
}
