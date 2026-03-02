import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Target, TrendingUp, Wallet, BarChart3, Check } from 'lucide-react';
import { useStore, mkId, WalletType, Currency } from '../store/useStore';

const steps = [
  {
    id: 0,
    emoji: '👋',
    title: 'Welcome to FinanceFlow',
    subtitle: 'Your personal finance command center',
    description: "Track income, expenses, savings goals and investments — all in one beautiful, smart dashboard.",
    color: 'from-violet-600 to-blue-600',
  },
  {
    id: 1,
    emoji: '💳',
    title: 'Set Up Your First Wallet',
    subtitle: 'Where do you keep your money?',
    description: 'Add a bank account, cash wallet, crypto or savings. You can always add more later.',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    id: 2,
    emoji: '🎯',
    title: 'What Are You Saving For?',
    subtitle: 'Goals keep you motivated',
    description: 'Set a goal — a vacation, a new gadget, an emergency fund. We\'ll track your progress automatically.',
    color: 'from-amber-500 to-orange-600',
  },
  {
    id: 3,
    emoji: '🚀',
    title: "You're All Set!",
    subtitle: 'Start tracking your finances',
    description: 'Add your first income or expense from the Dashboard. Your financial clarity starts now.',
    color: 'from-pink-500 to-rose-600',
  },
];

const walletTypeOptions: { type: WalletType; icon: string; label: string; placeholder: string }[] = [
  { type: 'bank', icon: '🏦', label: 'Bank Account', placeholder: 'e.g. Chase Checking' },
  { type: 'cash', icon: '💵', label: 'Cash', placeholder: 'e.g. Wallet Cash' },
  { type: 'savings', icon: '🐷', label: 'Savings', placeholder: 'e.g. Savings Account' },
  { type: 'crypto', icon: '₿', label: 'Crypto', placeholder: 'e.g. BTC Wallet' },
];

const goalIconOptions = ['💻', '✈️', '🛡️', '🚗', '🏠', '💍', '📚', '🏋️', '🌴', '💰', '🎸', '🎮'];
const goalColorOptions = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const { theme, addWallet, addGoal, setProfile, setOnboardingComplete } = useStore();
  const isDark = theme === 'dark';
  const [step, setStep] = useState(0);
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [walletForm, setWalletForm] = useState({
    name: '', type: 'bank' as WalletType, balance: '', currency: 'USD' as Currency,
    color: '#3b82f6', icon: '🏦', skip: false,
  });
  const [goalForm, setGoalForm] = useState({
    name: '', targetAmount: '', deadline: '', icon: '🎯', color: '#8b5cf6', skip: false,
  });

  const total = steps.length;

  const handleWalletTypeSelect = (type: WalletType) => {
    const opt = walletTypeOptions.find(o => o.type === type)!;
    setWalletForm(f => ({ ...f, type, icon: opt.icon }));
  };

  const canProceedStep1 = profileForm.name.trim().length > 0;
  // canProceedStep2 check is implicit in the UI (no hard gate on step 2)

  const handleFinish = () => {
    // Save profile
    if (profileForm.name) {
      setProfile({ name: profileForm.name, email: profileForm.email, avatar: '👤' });
    }
    // Save wallet
    if (!walletForm.skip && walletForm.name) {
      addWallet({
        id: mkId(), name: walletForm.name, type: walletForm.type,
        balance: parseFloat(walletForm.balance) || 0,
        currency: walletForm.currency, color: walletForm.color, icon: walletForm.icon,
      });
    }
    // Save goal
    if (!goalForm.skip && goalForm.name && goalForm.targetAmount && goalForm.deadline) {
      const target = parseFloat(goalForm.targetAmount);
      addGoal({
        id: mkId(), name: goalForm.name, targetAmount: target, currentAmount: 0,
        deadline: new Date(goalForm.deadline).toISOString(), priority: 'medium',
        status: 'active', color: goalForm.color, icon: goalForm.icon,
        milestones: [0.25, 0.5, 0.75].map(f => ({ amount: target * f, reached: false })),
        createdAt: new Date().toISOString(),
      });
    }
    setOnboardingComplete(true);
    onComplete();
  };

  const currentStep = steps[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>
      {/* Progress dots */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-2">
        {steps.map((_, i) => (
          <motion.div
            key={i}
            animate={{ width: i === step ? 24 : 8, opacity: i <= step ? 1 : 0.3 }}
            className="h-2 rounded-full bg-white"
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 60, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -60, scale: 0.96 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className={`w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}
        >
          {/* Top gradient banner */}
          <div className={`bg-gradient-to-br ${currentStep.color} p-8 text-center`}>
            <motion.div
              key={currentStep.emoji}
              initial={{ scale: 0.3, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 12, stiffness: 200 }}
              className="text-6xl mb-4 inline-block"
            >
              {currentStep.emoji}
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-1">{currentStep.title}</h2>
            <p className="text-white/70 text-sm">{currentStep.subtitle}</p>
          </div>

          <div className="p-6 space-y-5">
            <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {currentStep.description}
            </p>

            {/* Step 0 – Profile setup */}
            {step === 0 && (
              <div className="space-y-3">
                <div>
                  <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Your Name *</label>
                  <input
                    value={profileForm.name}
                    onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Alex Morgan"
                    autoFocus
                    className={`w-full px-4 py-3 rounded-2xl outline-none border-2 text-sm transition-colors ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-violet-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-violet-500'}`}
                  />
                </div>
                <div>
                  <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Email (optional)</label>
                  <input
                    value={profileForm.email}
                    onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="you@example.com"
                    type="email"
                    className={`w-full px-4 py-3 rounded-2xl outline-none border-2 text-sm transition-colors ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-violet-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-violet-500'}`}
                  />
                </div>
              </div>
            )}

            {/* Step 1 – Wallet setup */}
            {step === 1 && !walletForm.skip && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {walletTypeOptions.map(opt => (
                    <button
                      key={opt.type}
                      onClick={() => handleWalletTypeSelect(opt.type)}
                      className={`flex items-center gap-2 px-3 py-3 rounded-2xl border-2 text-sm font-medium transition-all ${walletForm.type === opt.type ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : isDark ? 'border-gray-700 text-gray-400 hover:border-gray-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                      <span className="text-xl">{opt.icon}</span>
                      <span className="text-xs">{opt.label}</span>
                    </button>
                  ))}
                </div>
                <input
                  value={walletForm.name}
                  onChange={e => setWalletForm(f => ({ ...f, name: e.target.value }))}
                  placeholder={walletTypeOptions.find(o => o.type === walletForm.type)?.placeholder || 'Wallet name'}
                  className={`w-full px-4 py-3 rounded-2xl outline-none border-2 text-sm transition-colors ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-emerald-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-emerald-500'}`}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    value={walletForm.balance}
                    onChange={e => setWalletForm(f => ({ ...f, balance: e.target.value }))}
                    placeholder="Current balance"
                    min="0"
                    step="0.01"
                    className={`w-full px-4 py-3 rounded-2xl outline-none border-2 text-sm transition-colors ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-emerald-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-emerald-500'}`}
                  />
                  <select
                    value={walletForm.currency}
                    onChange={e => setWalletForm(f => ({ ...f, currency: e.target.value as Currency }))}
                    className={`w-full px-4 py-3 rounded-2xl outline-none border-2 text-sm transition-colors ${isDark ? 'bg-gray-800 border-gray-700 text-white focus:border-emerald-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-emerald-500'}`}
                  >
                    {(['USD', 'EUR', 'GBP', 'RSD', 'BTC'] as Currency[]).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            {step === 1 && walletForm.skip && (
              <div className={`text-center py-4 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <span className="text-3xl">⏭️</span>
                <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Skipping wallet setup – you can add wallets later from the Wallets page.</p>
              </div>
            )}
            {step === 1 && (
              <button onClick={() => setWalletForm(f => ({ ...f, skip: !f.skip }))} className={`text-xs font-medium ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} underline underline-offset-2`}>
                {walletForm.skip ? 'Set up a wallet instead' : 'Skip for now'}
              </button>
            )}

            {/* Step 2 – Goal setup */}
            {step === 2 && !goalForm.skip && (
              <div className="space-y-3">
                <input
                  value={goalForm.name}
                  onChange={e => setGoalForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Goal name (e.g. Vacation Fund)"
                  className={`w-full px-4 py-3 rounded-2xl outline-none border-2 text-sm transition-colors ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-amber-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-amber-500'}`}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    value={goalForm.targetAmount}
                    onChange={e => setGoalForm(f => ({ ...f, targetAmount: e.target.value }))}
                    placeholder="Target amount"
                    min="1"
                    step="0.01"
                    className={`w-full px-4 py-3 rounded-2xl outline-none border-2 text-sm transition-colors ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-amber-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-amber-500'}`}
                  />
                  <input
                    type="date"
                    value={goalForm.deadline}
                    onChange={e => setGoalForm(f => ({ ...f, deadline: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-2xl outline-none border-2 text-sm transition-colors ${isDark ? 'bg-gray-800 border-gray-700 text-white focus:border-amber-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-amber-500'}`}
                  />
                </div>
                <div>
                  <p className={`text-xs font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Pick an icon</p>
                  <div className="flex flex-wrap gap-2">
                    {goalIconOptions.map(ic => (
                      <button key={ic} type="button" onClick={() => setGoalForm(f => ({ ...f, icon: ic }))}
                        className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border-2 transition-all ${goalForm.icon === ic ? 'border-amber-500 bg-amber-500/10' : isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className={`text-xs font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Pick a color</p>
                  <div className="flex gap-2">
                    {goalColorOptions.map(c => (
                      <button key={c} type="button" onClick={() => setGoalForm(f => ({ ...f, color: c }))}
                        className={`w-8 h-8 rounded-full border-4 transition-all ${goalForm.color === c ? 'border-white scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            {step === 2 && goalForm.skip && (
              <div className={`text-center py-4 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <span className="text-3xl">⏭️</span>
                <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Skipping goals setup – you can create goals anytime from the Goals page.</p>
              </div>
            )}
            {step === 2 && (
              <button onClick={() => setGoalForm(f => ({ ...f, skip: !f.skip }))} className={`text-xs font-medium ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} underline underline-offset-2`}>
                {goalForm.skip ? 'Set up a goal instead' : 'Skip for now'}
              </button>
            )}

            {/* Step 3 – Summary */}
            {step === 3 && (
              <div className="space-y-3">
                {[
                  { icon: <TrendingUp size={16} />, label: 'Dashboard', desc: 'See your balance & recent activity at a glance' },
                  { icon: <Target size={16} />, label: 'Goals', desc: 'Track savings goals with visual progress' },
                  { icon: <BarChart3 size={16} />, label: 'Stats', desc: 'Understand your spending with beautiful charts' },
                  { icon: <Wallet size={16} />, label: 'Wallets', desc: 'Manage all your accounts in one place' },
                ].map(({ icon, label, desc }) => (
                  <div key={label} className={`flex items-start gap-3 p-3 rounded-2xl ${isDark ? 'bg-gray-800/60' : 'bg-gray-50'}`}>
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-white flex-shrink-0 mt-0.5">
                      {icon}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{label}</p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-3 pt-2">
              {step > 0 && (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className={`px-5 py-3 rounded-2xl font-semibold text-sm ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}
                >
                  Back
                </button>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  if (step < total - 1) {
                    if (step === 0 && !canProceedStep1) return;
                    setStep(s => s + 1);
                  } else {
                    handleFinish();
                  }
                }}
                disabled={step === 0 && !canProceedStep1}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm text-white shadow-lg transition-all ${step === 0 && !canProceedStep1 ? 'opacity-50 cursor-not-allowed bg-gray-600' : `bg-gradient-to-r ${currentStep.color} shadow-violet-500/20`}`}
              >
                {step === total - 1 ? (
                  <><Check size={16} /> Let's Go!</>
                ) : (
                  <>Continue <ChevronRight size={16} /></>
                )}
              </motion.button>
            </div>

            {step === 0 && (
              <p className={`text-center text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                Your data stays private and is stored locally on your device.
              </p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
