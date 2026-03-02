import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { useStore, mkId, TransactionType, convertCurrency, formatCurrency } from '../store/useStore';
import { useModalHeight } from '../hooks/useModalHeight';

interface Props {
  type: TransactionType;
  onClose: () => void;
}

export default function QuickAddModal({ type, onClose }: Props) {
  const {
    categories, wallets, goals, currency,
    addTransaction, clearLastGoalUpdates, theme,
  } = useStore();
  const isDark = theme === 'dark';
  const { portalPaddingBottom, sheetMaxH } = useModalHeight();

  const [amount, setAmount]           = useState('');
  const [displayAmount, setDisplayAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory]       = useState('');
  const [walletId, setWalletId]       = useState(wallets[0]?.id || '');
  const [tags, setTags]               = useState('');
  const [success, setSuccess]         = useState(false);
  const [goalUpdates, setGoalUpdates] = useState<ReturnType<typeof useStore.getState>['lastGoalUpdates']>([]);

  const bodyRef = useRef<HTMLDivElement>(null);

  /* Lock body scroll */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  /* Scroll body to top when success screen appears */
  useEffect(() => {
    if (success && bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [success]);

  const filtered       = categories.filter(c => c.type === type);
  const selectedWallet = wallets.find(w => w.id === walletId);
  const parsedAmount   = parseFloat(amount.replace(/,/g, '')) || 0;

  const walletBalanceInMain = selectedWallet
    ? convertCurrency(selectedWallet.balance, selectedWallet.currency, currency)
    : 0;
  const newBalance     = type === 'income' ? walletBalanceInMain + parsedAmount : walletBalanceInMain - parsedAmount;
  const isInsufficient = type === 'expense' && parsedAmount > 0 && newBalance < 0;

  const activeGoals    = goals.filter(g => g.status === 'active' && g.currentAmount < g.targetAmount);
  const perGoalPreview = activeGoals.length > 0 && parsedAmount > 0
    ? parsedAmount / activeGoals.length : 0;

  const canSubmit = !!amount && !!category && !!walletId && parsedAmount > 0;

  /* Format number with commas */
  const handleAmountChange = (raw: string) => {
    // Remove everything except digits and one decimal point
    const cleaned = raw.replace(/[^0-9.]/g, '');
    // Prevent multiple decimal points
    const parts = cleaned.split('.');
    const integer = parts[0];
    const decimal = parts.length > 1 ? '.' + parts[1].slice(0, 2) : '';
    // Format integer part with commas
    const formatted = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + decimal;
    setDisplayAmount(formatted);
    setAmount(cleaned); // store raw value for parsing
  };

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    clearLastGoalUpdates();
    addTransaction({
      id: mkId(), amount: parsedAmount, type, category, walletId,
      description, date: new Date().toISOString(),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      currency,
    });
    const updates = useStore.getState().lastGoalUpdates;
    setGoalUpdates(updates);
    setSuccess(true);
    setTimeout(() => onClose(), updates.length > 0 ? 2600 : 1200);
  }, [canSubmit, parsedAmount, type, category, walletId, description, tags, currency, addTransaction, clearLastGoalUpdates, onClose]);

  /* ── colours ── */
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
    transition: 'border-color .15s',
    appearance: 'none', WebkitAppearance: 'none',
  };

  return (
    <AnimatePresence>
      {/* ── Full-screen portal ── */}
      <motion.div
        key="qa-portal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          /* KEY: push the sheet up above the mobile navbar */
          paddingBottom: portalPaddingBottom,
        }}
      >
        {/* Dim overlay */}
        <div
          onClick={onClose}
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
        />

        {/* ── Sheet ── */}
        <motion.div
          key="qa-sheet"
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
            /* maxHeight — uses dvh, no fixed height so footer is never clipped */
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
          {/* ── Success overlay ── */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  position: 'absolute', inset: 0, zIndex: 20,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  borderRadius: 28,
                  background: isDark ? 'rgba(17,24,39,0.98)' : 'rgba(255,255,255,0.98)',
                  padding: 24, overflowY: 'auto',
                }}
              >
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', delay: 0.05, damping: 12 }}
                  style={{ marginBottom: 12 }}
                >
                  <CheckCircle2 size={56} color="#34d399" />
                </motion.div>
                <p style={{ fontWeight: 700, color: textClr, fontSize: 20, marginBottom: 4, textAlign: 'center' }}>
                  {type === 'income' ? 'Income Added! 🎉' : 'Expense Logged! ✅'}
                </p>
                <p style={{ color: mutedClr, fontSize: 14, marginBottom: 16, textAlign: 'center' }}>
                  Wallet & stats updated instantly
                </p>
                {goalUpdates.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{ width: '100%' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Zap size={13} color="#a78bfa" />
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>
                        Auto-Contributed to Goals
                      </p>
                    </div>
                    {goalUpdates.map((upd, i) => (
                      <motion.div
                        key={upd.goalId}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 + i * 0.08 }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 12px', borderRadius: 16, marginBottom: 8,
                          background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(139,92,246,0.06)',
                          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(139,92,246,0.15)',
                        }}
                      >
                        <span style={{ fontSize: 20, flexShrink: 0 }}>{upd.goalIcon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: textClr, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                              {upd.goalName}
                            </p>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#34d399', flexShrink: 0 }}>
                              +{formatCurrency(upd.contributedAmount, currency)}
                            </span>
                          </div>
                          <div style={{ marginTop: 6, height: 6, borderRadius: 3, background: isDark ? '#374151' : '#e5e7eb', overflow: 'hidden' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${upd.newPct}%` }}
                              transition={{ duration: 0.8, delay: 0.35 + i * 0.08 }}
                              style={{ height: '100%', borderRadius: 3, backgroundColor: upd.goalColor }}
                            />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                            <p style={{ fontSize: 11, color: mutedClr, margin: 0 }}>{upd.newPct}% reached</p>
                            {upd.justCompleted && <span style={{ fontSize: 11, color: '#fbbf24', fontWeight: 700 }}>🎉 Completed!</span>}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━
              ZONE 1 — HEADER (fixed, never shrinks)
          ━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <div style={{ flexShrink: 0, flexGrow: 0, background: bg }}>
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4 }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: isDark ? '#374151' : '#d1d5db' }} />
            </div>
            {/* Title row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 20px 10px' }}>
              <div>
                <h2 style={{ fontSize: 19, fontWeight: 700, margin: 0, color: textClr }}>
                  {type === 'income' ? '➕ Add Income' : '➖ Add Expense'}
                </h2>
                <p style={{ fontSize: 12, color: mutedClr, margin: '2px 0 0' }}>
                  {activeGoals.length > 0
                    ? `⚡ Auto-funds ${activeGoals.length} active goal${activeGoals.length !== 1 ? 's' : ''}`
                    : 'Updates wallet balance instantly'}
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 40, height: 40, flexShrink: 0, borderRadius: 12,
                  border: 'none', cursor: 'pointer',
                  background: isDark ? '#1f2937' : '#f3f4f6',
                  color: isDark ? '#9ca3af' : '#6b7280',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ height: 1, background: dividerClr }} />
          </div>

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━
              ZONE 2 — BODY (scrollable, fills available space)
          ━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <div
            ref={bodyRef}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Auto-contribute preview */}
              {activeGoals.length > 0 && parsedAmount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: '12px 14px', borderRadius: 16,
                    background: 'rgba(139,92,246,0.1)',
                    border: '1px solid rgba(139,92,246,0.25)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Zap size={12} color="#a78bfa" />
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', margin: 0 }}>Auto-Contribute Preview</p>
                  </div>
                  {activeGoals.slice(0, 3).map(g => {
                    const remaining = g.targetAmount - g.currentAmount;
                    const actual    = Math.min(perGoalPreview, remaining);
                    return (
                      <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: mutedClr, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span>{g.icon}</span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>{g.name}</span>
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#c4b5fd' }}>+{formatCurrency(actual, currency)}</span>
                      </div>
                    );
                  })}
                  {activeGoals.length > 3 && (
                    <p style={{ fontSize: 11, color: mutedClr, margin: '4px 0 0' }}>+{activeGoals.length - 3} more goals</p>
                  )}
                </motion.div>
              )}

              {/* Amount */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 7, color: labelClr }}>
                  Amount ({currency})
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={displayAmount}
                  onChange={e => handleAmountChange(e.target.value)}
                  autoFocus
                  style={{
                    ...inp,
                    fontSize: 26, fontWeight: 700, padding: '14px 16px',
                    borderColor: isInsufficient ? '#ef4444' : inputBdr,
                    background: isInsufficient ? 'rgba(239,68,68,0.05)' : inputBg,
                    color: isInsufficient ? '#ef4444' : textClr,
                  }}
                />
              </div>

              {/* Wallet */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 7, color: labelClr }}>
                  Wallet
                </label>
                {wallets.length === 0 ? (
                  <div style={{ ...inp, color: mutedClr, fontSize: 14 }}>
                    ⚠️ No wallets — add one first
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <select
                      value={walletId}
                      onChange={e => setWalletId(e.target.value)}
                      style={{ ...inp, paddingRight: 40 }}
                    >
                      {wallets.map(w => (
                        <option key={w.id} value={w.id}>
                          {w.icon} {w.name} ({formatCurrency(w.balance, w.currency)})
                        </option>
                      ))}
                    </select>
                    {selectedWallet && parsedAmount > 0 && (
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '8px 12px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                        background: isInsufficient ? 'rgba(239,68,68,0.1)' : isDark ? '#1f2937' : '#f3f4f6',
                        border: isInsufficient ? '1px solid rgba(239,68,68,0.3)' : '1px solid transparent',
                        color: isInsufficient ? '#ef4444' : labelClr,
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {isInsufficient ? <><AlertCircle size={11} /> Insufficient</> : 'Balance after:'}
                        </span>
                        <span style={{ fontWeight: 700, color: isInsufficient ? '#ef4444' : type === 'income' ? '#34d399' : textClr }}>
                          {isInsufficient
                            ? `Missing ${formatCurrency(Math.abs(newBalance), currency)}`
                            : formatCurrency(Math.abs(newBalance), currency)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Category */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 7, color: labelClr }}>
                  Category <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {filtered.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        gap: 5, padding: '10px 4px', borderRadius: 14, border: 'none',
                        cursor: 'pointer', transition: 'all .15s',
                        height: 'auto', minHeight: 'unset',
                        background: category === cat.id ? 'rgba(139,92,246,0.15)' : isDark ? '#1f2937' : '#f9fafb',
                        outline: category === cat.id ? '2px solid #7c3aed' : `2px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                      }}
                    >
                      <span style={{ fontSize: 22, lineHeight: 1 }}>{cat.icon}</span>
                      <span style={{ fontSize: 10, fontWeight: 500, textAlign: 'center', lineHeight: 1.2, color: category === cat.id ? '#a78bfa' : mutedClr }}>
                        {cat.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 7, color: labelClr }}>
                  Description
                </label>
                <input
                  type="text"
                  placeholder="What was this for?"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  style={inp}
                />
              </div>

              {/* Tags */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 7, color: labelClr }}>
                  Tags <span style={{ fontWeight: 400, opacity: 0.6 }}>(comma separated)</span>
                </label>
                <input
                  type="text"
                  placeholder="food, work, personal..."
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  style={inp}
                />
              </div>

              {/* Spacer so last field isn't flush against footer */}
              <div style={{ height: 8 }} />
            </div>
          </div>

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              ZONE 3 — FOOTER (fixed, ALWAYS VISIBLE)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
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
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={onClose}
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
                onClick={handleSubmit}
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
                  background: type === 'income'
                    ? 'linear-gradient(135deg,#10b981,#0d9488)'
                    : 'linear-gradient(135deg,#ef4444,#e11d48)',
                  boxShadow: canSubmit
                    ? type === 'income'
                      ? '0 4px 20px rgba(16,185,129,0.4)'
                      : '0 4px 20px rgba(239,68,68,0.4)'
                    : 'none',
                  transition: 'opacity .2s, box-shadow .2s',
                }}
              >
                {type === 'income' ? '＋ Add Income' : '− Log Expense'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
