import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TransactionType = 'income' | 'expense';
export type WalletType = 'cash' | 'bank' | 'crypto' | 'savings';
export type Currency = 'USD' | 'EUR' | 'RSD' | 'GBP' | 'BTC';
export type Theme = 'light' | 'dark' | 'system';
export type GoalPriority = 'low' | 'medium' | 'high';
export type GoalStatus = 'active' | 'paused' | 'completed';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  walletId: string;
  description: string;
  date: string;
  tags: string[];
  currency: Currency;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  priority: GoalPriority;
  status: GoalStatus;
  color: string;
  icon: string;
  milestones: { amount: number; reached: boolean }[];
  createdAt: string;
}

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  balance: number;
  currency: Currency;
  color: string;
  icon: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
}

export interface GoalAutoUpdate {
  goalId: string;
  goalName: string;
  goalIcon: string;
  goalColor: string;
  contributedAmount: number;
  newCurrentAmount: number;
  newPct: number;
  justCompleted: boolean;
}

interface AppState {
  theme: Theme;
  currency: Currency;
  profile: UserProfile;
  wallets: Wallet[];
  transactions: Transaction[];
  goals: Goal[];
  categories: Category[];
  onboardingComplete: boolean;

  // After every addTransaction, holds which goals were auto-updated
  lastGoalUpdates: GoalAutoUpdate[];

  // Actions
  setTheme: (theme: Theme) => void;
  setCurrency: (currency: Currency) => void;
  setProfile: (profile: UserProfile) => void;
  setOnboardingComplete: (v: boolean) => void;
  clearLastGoalUpdates: () => void;

  addTransaction: (tx: Transaction) => void;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, goal: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  contributeToGoal: (id: string, amount: number, walletId?: string) => void;

  addWallet: (wallet: Wallet) => void;
  updateWallet: (id: string, wallet: Partial<Wallet>) => void;
  deleteWallet: (id: string) => void;
  transferBetweenWallets: (fromId: string, toId: string, amount: number) => void;
}

export const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  RSD: 108.5,
  BTC: 0.000016,
};

export const convertCurrency = (amount: number, from: Currency, to: Currency): number => {
  const inUSD = amount / EXCHANGE_RATES[from];
  return inUSD * EXCHANGE_RATES[to];
};

export const formatCurrency = (amount: number, currency: Currency): string => {
  if (currency === 'BTC') return `₿${amount.toFixed(6)}`;
  if (currency === 'RSD') return `${amount.toLocaleString('sr-RS', { maximumFractionDigits: 0 })} din`;
  const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' };
  return `${symbols[currency]}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const mkId = (): string => Math.random().toString(36).substr(2, 9);

export const defaultCategories: Category[] = [
  { id: 'salary',        name: 'Salary',        icon: '💼', color: '#10b981', type: 'income' },
  { id: 'freelance',     name: 'Freelance',      icon: '💻', color: '#3b82f6', type: 'income' },
  { id: 'investment',    name: 'Investment',     icon: '📈', color: '#8b5cf6', type: 'income' },
  { id: 'gift',          name: 'Gift',           icon: '🎁', color: '#f59e0b', type: 'income' },
  { id: 'other-in',      name: 'Other',          icon: '💰', color: '#6b7280', type: 'income' },
  { id: 'food',          name: 'Food',           icon: '🍕', color: '#ef4444', type: 'expense' },
  { id: 'transport',     name: 'Transport',      icon: '🚗', color: '#f97316', type: 'expense' },
  { id: 'shopping',      name: 'Shopping',       icon: '🛍️', color: '#ec4899', type: 'expense' },
  { id: 'bills',         name: 'Bills',          icon: '🧾', color: '#6366f1', type: 'expense' },
  { id: 'health',        name: 'Health',         icon: '🏥', color: '#14b8a6', type: 'expense' },
  { id: 'entertainment', name: 'Entertainment',  icon: '🎮', color: '#a855f7', type: 'expense' },
  { id: 'education',     name: 'Education',      icon: '📚', color: '#0ea5e9', type: 'expense' },
  { id: 'rent',          name: 'Rent',           icon: '🏠', color: '#84cc16', type: 'expense' },
  { id: 'other-ex',      name: 'Other',          icon: '💸', color: '#6b7280', type: 'expense' },
];

/** Apply a transaction's effect to wallet list */
function applyTxToWallets(wallets: Wallet[], tx: Transaction, reverse = false): Wallet[] {
  return wallets.map(w => {
    if (w.id !== tx.walletId) return w;
    const sign = tx.type === 'income' ? 1 : -1;
    const delta = sign * tx.amount * (reverse ? -1 : 1);
    return { ...w, balance: w.balance + delta };
  });
}

/**
 * Every transaction automatically contributes its FULL amount to every active goal.
 * Goals are filled one by one (in order) until each is complete.
 * The transaction amount is split across goals — first goal gets filled first,
 * then the remainder goes to the next, etc.
 * If there's only 1 goal, it gets the full amount.
 * If there are multiple goals, the amount is distributed equally across all active goals.
 */
function autoContributeToGoals(
  goals: Goal[],
  txAmount: number
): { updatedGoals: Goal[]; updates: GoalAutoUpdate[] } {
  const updates: GoalAutoUpdate[] = [];

  // Only process active goals that are not yet complete
  const activeGoals = goals.filter(g => g.status === 'active' && g.currentAmount < g.targetAmount);

  if (activeGoals.length === 0) {
    return { updatedGoals: goals, updates };
  }

  // Distribute the transaction amount equally across all active incomplete goals
  const perGoalAmount = txAmount / activeGoals.length;

  const updatedGoals = goals.map(goal => {
    if (goal.status !== 'active') return goal;
    if (goal.currentAmount >= goal.targetAmount) return goal;

    // Cap contribution at remaining needed
    const remaining = goal.targetAmount - goal.currentAmount;
    const contribution = Math.min(perGoalAmount, remaining);

    if (contribution <= 0) return goal;

    const newCurrentAmount = goal.currentAmount + contribution;
    const newPct = Math.min(Math.round((newCurrentAmount / goal.targetAmount) * 100), 100);
    const justCompleted = newCurrentAmount >= goal.targetAmount;

    // Update milestones
    const milestones = goal.milestones.map(m => ({
      ...m,
      reached: m.reached || newCurrentAmount >= m.amount,
    }));

    const status: GoalStatus = justCompleted ? 'completed' : goal.status;

    updates.push({
      goalId: goal.id,
      goalName: goal.name,
      goalIcon: goal.icon,
      goalColor: goal.color,
      contributedAmount: contribution,
      newCurrentAmount,
      newPct,
      justCompleted,
    });

    return { ...goal, currentAmount: newCurrentAmount, milestones, status };
  });

  return { updatedGoals, updates };
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      currency: 'USD',
      profile: { name: '', email: '', avatar: '👤' },
      wallets: [],
      transactions: [],
      goals: [],
      categories: defaultCategories,
      onboardingComplete: false,
      lastGoalUpdates: [],

      setTheme:              (theme)    => set({ theme }),
      setCurrency:           (currency) => set({ currency }),
      setProfile:            (profile)  => set({ profile }),
      setOnboardingComplete: (v)        => set({ onboardingComplete: v }),
      clearLastGoalUpdates:  ()         => set({ lastGoalUpdates: [] }),

      // ─── TRANSACTIONS ──────────────────────────────────────────────────────

      addTransaction: (tx) => set((s) => {
        // 1. Update wallet balance
        const wallets = applyTxToWallets(s.wallets, tx);

        // 2. Automatically contribute the full transaction amount to ALL active goals
        const { updatedGoals, updates } = autoContributeToGoals(s.goals, tx.amount);

        return {
          transactions: [tx, ...s.transactions],
          wallets,
          goals: updatedGoals,
          lastGoalUpdates: updates,
        };
      }),

      updateTransaction: (id, changes) => set((s) => {
        const old = s.transactions.find(t => t.id === id);
        if (!old) return {};
        const updated = { ...old, ...changes };
        let wallets = applyTxToWallets(s.wallets, old, true);
        wallets = applyTxToWallets(wallets, updated, false);
        return {
          transactions: s.transactions.map(t => t.id === id ? updated : t),
          wallets,
        };
      }),

      deleteTransaction: (id) => set((s) => {
        const tx = s.transactions.find(t => t.id === id);
        if (!tx) return { transactions: s.transactions.filter(t => t.id !== id) };
        return {
          transactions: s.transactions.filter(t => t.id !== id),
          wallets: applyTxToWallets(s.wallets, tx, true),
        };
      }),

      // ─── GOALS ─────────────────────────────────────────────────────────────

      addGoal: (goal) => set((s) => ({ goals: [goal, ...s.goals] })),

      updateGoal: (id, goal) => set((s) => ({
        goals: s.goals.map(g => g.id === id ? { ...g, ...goal } : g),
      })),

      deleteGoal: (id) => set((s) => ({ goals: s.goals.filter(g => g.id !== id) })),

      contributeToGoal: (id, amount, walletId) => set((s) => {
        const goals = s.goals.map(g => {
          if (g.id !== id) return g;
          const newAmount = Math.min(g.currentAmount + amount, g.targetAmount);
          const milestones = g.milestones.map(m => ({
            ...m,
            reached: m.reached || newAmount >= m.amount,
          }));
          const status: GoalStatus = newAmount >= g.targetAmount ? 'completed' : g.status;
          return { ...g, currentAmount: newAmount, milestones, status };
        });

        let wallets = s.wallets;
        if (walletId) {
          wallets = wallets.map(w =>
            w.id === walletId ? { ...w, balance: w.balance - amount } : w
          );
        }

        return { goals, wallets };
      }),

      // ─── WALLETS ───────────────────────────────────────────────────────────

      addWallet: (wallet) => set((s) => ({ wallets: [...s.wallets, wallet] })),

      updateWallet: (id, wallet) => set((s) => ({
        wallets: s.wallets.map(w => w.id === id ? { ...w, ...wallet } : w),
      })),

      deleteWallet: (id) => set((s) => ({ wallets: s.wallets.filter(w => w.id !== id) })),

      transferBetweenWallets: (fromId, toId, amount) => set((s) => ({
        wallets: s.wallets.map(w => {
          if (w.id === fromId) return { ...w, balance: w.balance - amount };
          if (w.id === toId)   return { ...w, balance: w.balance + amount };
          return w;
        }),
      })),
    }),
    { name: 'financeflow-v4' }
  )
);
