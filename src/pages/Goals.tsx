import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pause, Play, Trash2, Trophy, Zap, CheckCircle2, X } from 'lucide-react';
import { useStore, GoalPriority, mkId, formatCurrency, convertCurrency } from '../store/useStore';
import { useModalHeight } from '../hooks/useModalHeight';
import type { Wallet } from '../store/useStore';

function CircularProgress({ pct, color, size = 72 }: { pct: number; color: string; size?: number }) {
  const r    = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90" style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ffffff10" strokeWidth={8} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={8} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - (pct / 100) * circ }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
      />
    </svg>
  );
}

const priorityColors: Record<GoalPriority, string> = {
  high:   'text-red-400 bg-red-400/10',
  medium: 'text-amber-400 bg-amber-400/10',
  low:    'text-emerald-400 bg-emerald-400/10',
};

const goalIcons  = ['💻','✈️','🛡️','🎮','🚗','🏠','💍','📚','🏋️','🎸','🌴','💰'];
const goalColors = ['#3b82f6','#10b981','#8b5cf6','#f59e0b','#ef4444','#ec4899','#14b8a6','#f97316'];

export default function Goals() {
  const {
    goals, wallets, currency,
    addGoal, updateGoal, deleteGoal, contributeToGoal,
    lastGoalUpdates, theme,
  } = useStore();
  const isDark = theme === 'dark';

  const { portalPaddingBottom, sheetMaxH } = useModalHeight();

  const [showAdd,       setShowAdd]       = useState(false);
  const [contributeId,  setContributeId]  = useState<string | null>(null);
  const [contributeAmt, setContributeAmt] = useState('');
  const [contributeWId, setContributeWId] = useState(wallets[0]?.id || '');
  const [useWallet,     setUseWallet]     = useState(false);
  const [celebrating,   setCelebrating]   = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '', targetAmount: '', deadline: '',
    priority: 'medium' as GoalPriority,
    icon: '🎯', color: '#8b5cf6',
  });

  /* lock body scroll when modal open */
  useEffect(() => {
    if (showAdd) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showAdd]);

  const handleAddGoal = useCallback(() => {
    const target = parseFloat(form.targetAmount);
    if (!form.name || !target || !form.deadline) return;
    addGoal({
      id: mkId(), name: form.name, targetAmount: target, currentAmount: 0,
      deadline: new Date(form.deadline).toISOString(), priority: form.priority,
      status: 'active', color: form.color, icon: form.icon,
      milestones: [0.25, 0.5, 0.75].map(f => ({ amount: target * f, reached: false })),
      createdAt: new Date().toISOString(),
    });
    setForm({ name: '', targetAmount: '', deadline: '', priority: 'medium', icon: '🎯', color: '#8b5cf6' });
    setShowAdd(false);
  }, [form, addGoal]);

  const handleContribute = (id: string) => {
    const amt = parseFloat(contributeAmt);
    if (!amt || amt <= 0) return;
    if (useWallet && contributeWId) {
      const w = wallets.find((w: Wallet) => w.id === contributeWId);
      if (w && w.balance < amt) {
        alert(`Insufficient balance in ${w.name}. Available: ${formatCurrency(w.balance, w.currency)}`);
        return;
      }
    }
    const goal = goals.find(g => g.id === id);
    if (goal && goal.currentAmount + amt >= goal.targetAmount) {
      setCelebrating(id);
      setTimeout(() => setCelebrating(null), 3000);
    }
    contributeToGoal(id, amt, useWallet && contributeWId ? contributeWId : undefined);
    setContributeId(null);
    setContributeAmt('');
  };

  const active    = goals.filter(g => g.status === 'active');
  const paused    = goals.filter(g => g.status === 'paused');
  const completed = goals.filter(g => g.status === 'completed');

  const selWallet   = wallets.find((w: Wallet) => w.id === contributeWId);
  const contribNum  = parseFloat(contributeAmt) || 0;
  const walletAfter = selWallet
    ? convertCurrency(selWallet.balance, selWallet.currency, currency) - contribNum
    : 0;
  const recentUpdates = lastGoalUpdates.filter(u => goals.some(g => g.id === u.goalId));
  const canCreateGoal = !!form.name && !!form.targetAmount && !!form.deadline;

  /* shared styles */
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

  return (
    <div className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-5 md:py-8 space-y-5 md:space-y-6">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">Goals</h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {goals.length > 0
              ? `${active.length} active · ${completed.length} completed`
              : 'Start saving toward something meaningful'}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{ minHeight: 44, height: 44 }}
          className="flex items-center gap-2 px-4 rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold text-sm shadow-lg shadow-violet-500/30 flex-shrink-0"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New Goal</span>
          <span className="sm:hidden">New</span>
        </button>
      </motion.div>

      {/* Auto-contribute banner */}
      {active.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-violet-500/10 border border-violet-500/20">
          <motion.div
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
            className="mt-0.5 flex-shrink-0"
          >
            <Zap size={15} className="text-violet-400" />
          </motion.div>
          <div>
            <p className="text-sm font-bold text-violet-300">Auto-contribute is ON</p>
            <p className="text-xs text-violet-400/80 mt-0.5">
              Every transaction automatically contributes its full amount, split equally across your {active.length} active goal{active.length !== 1 ? 's' : ''}.
            </p>
          </div>
        </motion.div>
      )}

      {/* Recent auto-update banner */}
      <AnimatePresence>
        {recentUpdates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className={`rounded-2xl p-4 space-y-2 border ${isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
              <p className="text-xs font-bold text-emerald-400">Transaction auto-contributed to goals! ⚡</p>
            </div>
            {recentUpdates.map(upd => (
              <div key={upd.goalId} className="flex items-center justify-between text-xs gap-2">
                <span className={`flex items-center gap-1.5 min-w-0 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  <span>{upd.goalIcon}</span>
                  <span className="truncate">{upd.goalName}</span>
                  {upd.justCompleted && <span className="text-amber-400 font-bold flex-shrink-0">🎉</span>}
                </span>
                <span className="text-emerald-400 font-bold flex-shrink-0">
                  +{formatCurrency(upd.contributedAmount, currency)}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {goals.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl p-8 sm:p-10 text-center ${isDark ? 'bg-gray-900/60 border border-gray-800' : 'bg-white/60 border border-gray-100'} backdrop-blur-xl`}>
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-xl font-bold mb-2">No goals yet</h2>
          <p className={`text-sm mb-6 max-w-xs mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Create a goal and <strong>every transaction you add will automatically fund it</strong>.
          </p>
          <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto mb-6">
            {[{ icon: '✈️', name: 'Vacation' }, { icon: '🐷', name: 'Emergency' }, { icon: '💻', name: 'New Laptop' }].map(({ icon, name }) => (
              <button
                key={name}
                onClick={() => { setForm(f => ({ ...f, name, icon })); setShowAdd(true); }}
                style={{ minHeight: 72, height: 'auto' }}
                className={`p-3 rounded-2xl text-center border-2 border-dashed transition-all flex flex-col items-center justify-center gap-1 ${isDark ? 'border-gray-700 text-gray-400 hover:border-violet-500 hover:text-violet-400' : 'border-gray-200 text-gray-500 hover:border-violet-400 hover:text-violet-600'}`}
              >
                <span className="text-2xl">{icon}</span>
                <p className="text-xs font-medium">{name}</p>
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAdd(true)}
            style={{ minHeight: 48, height: 48 }}
            className="px-6 rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-bold text-sm shadow-lg shadow-violet-500/20"
          >
            Create First Goal
          </button>
        </motion.div>
      )}

      {/* Goals list */}
      {(['active', 'paused', 'completed'] as const).map(status => {
        const items = status === 'active' ? active : status === 'paused' ? paused : completed;
        if (items.length === 0) return null;
        const label = status === 'completed' ? 'Completed 🎉' : status.charAt(0).toUpperCase() + status.slice(1);
        return (
          <div key={status}>
            <h2 className={`font-bold text-xs mb-3 uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</h2>
            <div className="space-y-4">
              {items.map((goal, i) => {
                const pct       = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
                const daysLeft  = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000);
                const remaining = goal.targetAmount - goal.currentAmount;
                const recentUpd = lastGoalUpdates.find(u => u.goalId === goal.id);

                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className={`rounded-3xl p-4 sm:p-5 relative overflow-hidden ${isDark ? 'bg-gray-900/80 border border-gray-800' : 'bg-white/80 border border-gray-200'} backdrop-blur-xl shadow-lg`}
                  >
                    <AnimatePresence>
                      {celebrating === goal.id && (
                        <motion.div
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="absolute inset-0 flex items-center justify-center z-20 bg-black/60 rounded-3xl"
                        >
                          <motion.div animate={{ scale: [0.5, 1.15, 1] }} transition={{ duration: 0.5 }} className="text-center">
                            <div className="text-6xl mb-2">🎉</div>
                            <p className="text-white font-bold text-lg">Goal Achieved!</p>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {recentUpd && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                      >
                        <Zap size={11} className="text-emerald-400 flex-shrink-0" />
                        <p className="text-xs text-emerald-400 font-semibold truncate">
                          +{formatCurrency(recentUpd.contributedAmount, currency)} just added!
                          {recentUpd.justCompleted && ' 🎉'}
                        </p>
                      </motion.div>
                    )}

                    <div className="flex gap-3 sm:gap-4">
                      <div className="relative flex-shrink-0">
                        <CircularProgress pct={pct} color={goal.color} size={68} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xl">{goal.icon}</span>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-bold text-sm sm:text-base truncate">{goal.name}</h3>
                              {goal.status === 'active' && (
                                <motion.span
                                  animate={{ scale: [1, 1.3, 1] }}
                                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                  title="Auto-contribute active"
                                >⚡</motion.span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${priorityColors[goal.priority]}`}>
                                {goal.priority}
                              </span>
                              {goal.status !== 'completed' && (
                                daysLeft > 0
                                  ? <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{daysLeft}d left</span>
                                  : <span className="text-xs text-red-400">Overdue</span>
                              )}
                            </div>
                          </div>
                          <p className="font-bold text-lg flex-shrink-0" style={{ color: goal.color }}>{pct}%</p>
                        </div>

                        <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatCurrency(goal.currentAmount, currency)}
                          <span className="opacity-60"> of </span>
                          {formatCurrency(goal.targetAmount, currency)}
                          {remaining > 0 && (
                            <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                              {' '}({formatCurrency(remaining, currency)} left)
                            </span>
                          )}
                        </p>

                        <div className="flex gap-1 mt-3">
                          {goal.milestones.map((m, mi) => (
                            <div
                              key={mi}
                              className="h-1.5 flex-1 rounded-full transition-colors"
                              style={{ backgroundColor: m.reached ? goal.color : isDark ? '#1f2937' : '#f3f4f6' }}
                            />
                          ))}
                        </div>

                        <div className="flex gap-2 mt-3 flex-wrap">
                          {goal.status !== 'completed' && (
                            <>
                              <button
                                onClick={() => {
                                  setContributeId(contributeId === goal.id ? null : goal.id);
                                  setContributeAmt('');
                                  setContributeWId(wallets[0]?.id || '');
                                  setUseWallet(wallets.length > 0);
                                }}
                                style={{ minHeight: 36, height: 36, backgroundColor: goal.color }}
                                className="text-xs px-3 rounded-xl font-semibold text-white"
                              >
                                + Add Money
                              </button>
                              <button
                                onClick={() => updateGoal(goal.id, { status: goal.status === 'active' ? 'paused' : 'active' })}
                                style={{ minHeight: 36, height: 36, width: 36, minWidth: 36 }}
                                className={`rounded-xl flex items-center justify-center ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}
                              >
                                {goal.status === 'active' ? <Pause size={13} /> : <Play size={13} />}
                              </button>
                            </>
                          )}
                          {goal.status === 'completed' && (
                            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 py-2">
                              <Trophy size={12} /> Completed! 🎉
                            </span>
                          )}
                          <button
                            onClick={() => deleteGoal(goal.id)}
                            style={{ minHeight: 36, height: 36, width: 36, minWidth: 36 }}
                            className={`rounded-xl ml-auto flex items-center justify-center ${isDark ? 'bg-gray-800 text-gray-500 hover:text-red-400' : 'bg-gray-100 text-gray-400 hover:text-red-500'}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Manual Contribute Panel */}
                    <AnimatePresence>
                      {contributeId === goal.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden mt-4"
                        >
                          <div className={`p-4 rounded-2xl space-y-3 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                            <p className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              Manually add money to this goal
                            </p>
                            <input
                              type="number"
                              inputMode="decimal"
                              placeholder="Amount to save"
                              value={contributeAmt}
                              onChange={e => setContributeAmt(e.target.value)}
                              autoFocus min="0.01" step="0.01"
                              style={{ fontSize: 16 }}
                              className={`w-full px-3 py-3 rounded-xl outline-none border-2 font-semibold transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:border-violet-500 placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 focus:border-violet-500 placeholder-gray-400'}`}
                            />
                            {wallets.length > 0 && (
                              <div className="space-y-2">
                                <button
                                  type="button"
                                  onClick={() => setUseWallet(v => !v)}
                                  style={{ minHeight: 'unset', height: 'auto' }}
                                  className="flex items-center gap-2"
                                >
                                  <div className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors ${useWallet ? 'bg-violet-600' : isDark ? 'bg-gray-600' : 'bg-gray-300'}`}>
                                    <motion.div animate={{ x: useWallet ? 16 : 0 }} className="w-4 h-4 rounded-full bg-white shadow" />
                                  </div>
                                  <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Deduct from wallet
                                  </span>
                                </button>
                                {useWallet && (
                                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
                                    <select
                                      value={contributeWId}
                                      onChange={e => setContributeWId(e.target.value)}
                                      style={{ fontSize: 16 }}
                                      className={`w-full px-3 py-2.5 rounded-xl outline-none border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                                    >
                                      {wallets.map((w: Wallet) => (
                                        <option key={w.id} value={w.id}>
                                          {w.icon} {w.name} — {formatCurrency(w.balance, w.currency)}
                                        </option>
                                      ))}
                                    </select>
                                    {contribNum > 0 && selWallet && (
                                      <div className={`flex justify-between px-2 py-1.5 rounded-lg text-xs ${walletAfter < 0 ? 'bg-red-500/10 text-red-400' : isDark ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                                        <span>Wallet after:</span>
                                        <span className="font-semibold">
                                          {walletAfter < 0
                                            ? `⚠️ Short by ${formatCurrency(Math.abs(walletAfter), currency)}`
                                            : formatCurrency(walletAfter, currency)}
                                        </span>
                                      </div>
                                    )}
                                  </motion.div>
                                )}
                              </div>
                            )}
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => handleContribute(goal.id)}
                                disabled={!contributeAmt || parseFloat(contributeAmt) <= 0}
                                style={{ minHeight: 44, height: 44, backgroundColor: goal.color }}
                                className="flex-1 rounded-xl text-white text-sm font-semibold disabled:opacity-40"
                              >
                                Save to Goal
                              </button>
                              <button
                                onClick={() => setContributeId(null)}
                                style={{ minHeight: 44, height: 44 }}
                                className={`px-4 rounded-xl text-sm ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          ADD GOAL MODAL — 100% inline styles
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            key="goal-portal"
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
              onClick={() => setShowAdd(false)}
              style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
              }}
            />

            {/* Sheet — 100% inline */}
            <motion.div
              key="goal-sheet"
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 20px 10px' }}>
                  <h2 style={{ fontSize: 19, fontWeight: 700, margin: 0, color: textClr }}>🎯 Create New Goal</h2>
                  <button
                    onClick={() => setShowAdd(false)}
                    style={{
                      width: 40, height: 40, flexShrink: 0, borderRadius: 12,
                      border: 'none', cursor: 'pointer',
                      background: isDark ? '#1f2937' : '#f3f4f6',
                      color: mutedClr, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
                {/* Info banner */}
                <div style={{ padding: '0 20px 12px' }}>
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                    padding: '10px 14px', borderRadius: 14,
                    background: isDark ? 'rgba(139,92,246,0.1)' : 'rgba(237,233,254,0.8)',
                    border: isDark ? '1px solid rgba(139,92,246,0.2)' : '1px solid rgba(196,181,253,0.5)',
                  }}>
                    <Zap size={13} color="#a78bfa" style={{ marginTop: 2, flexShrink: 0 }} />
                    <p style={{ fontSize: 12, color: isDark ? '#c4b5fd' : '#6d28d9', margin: 0 }}>
                      <strong>Auto-contribute is always ON.</strong> Every transaction will automatically fund this goal!
                    </p>
                  </div>
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

                  {/* Goal Name */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 7, color: labelClr }}>
                      Goal Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. New MacBook"
                      autoFocus
                      style={inp}
                    />
                  </div>

                  {/* Target + Deadline */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 7, color: labelClr }}>
                        Target ({currency}) <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={form.targetAmount}
                        onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))}
                        placeholder="0.00"
                        min="1" step="0.01"
                        style={inp}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 7, color: labelClr }}>
                        Deadline <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="date"
                        value={form.deadline}
                        onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                        style={inp}
                      />
                    </div>
                  </div>

                  {/* Priority */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 7, color: labelClr }}>
                      Priority
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(['low', 'medium', 'high'] as GoalPriority[]).map(p => {
                        const colors = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' };
                        const selected = form.priority === p;
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setForm(f => ({ ...f, priority: p }))}
                            style={{
                              flex: 1, height: 44, minHeight: 44, borderRadius: 12, border: 'none', cursor: 'pointer',
                              fontWeight: 600, fontSize: 14, fontFamily: 'inherit',
                              textTransform: 'capitalize',
                              background: selected ? `${colors[p]}20` : isDark ? '#1f2937' : '#f9fafb',
                              color: selected ? colors[p] : mutedClr,
                              outline: selected ? `2px solid ${colors[p]}` : `2px solid ${inputBdr}`,
                            }}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Icon picker */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 7, color: labelClr }}>
                      Icon
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                      {goalIcons.map(ic => (
                        <button
                          key={ic}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, icon: ic }))}
                          style={{
                            height: 48, minHeight: 48, borderRadius: 12, border: 'none', cursor: 'pointer',
                            fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: form.icon === ic ? 'rgba(139,92,246,0.15)' : isDark ? '#1f2937' : '#f9fafb',
                            outline: form.icon === ic ? '2px solid #7c3aed' : `2px solid ${inputBdr}`,
                            transition: 'all .15s',
                          }}
                        >
                          {ic}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color picker */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 7, color: labelClr }}>
                      Color
                    </label>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {goalColors.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, color: c }))}
                          style={{
                            width: 38, height: 38, minHeight: 38, borderRadius: '50%', cursor: 'pointer',
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
                    onClick={() => setShowAdd(false)}
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
                    onClick={handleAddGoal}
                    disabled={!canCreateGoal}
                    style={{
                      flex: 2,
                      height: 54,
                      minHeight: 54,
                      borderRadius: 16,
                      border: 'none',
                      cursor: canCreateGoal ? 'pointer' : 'not-allowed',
                      fontWeight: 700,
                      fontSize: 15,
                      fontFamily: 'inherit',
                      color: '#fff',
                      opacity: canCreateGoal ? 1 : 0.38,
                      background: 'linear-gradient(135deg,#7c3aed,#2563eb)',
                      boxShadow: canCreateGoal ? '0 4px 20px rgba(124,58,237,0.4)' : 'none',
                      transition: 'opacity .2s, box-shadow .2s',
                    }}
                  >
                    Create Goal
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
