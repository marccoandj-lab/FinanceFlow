import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from './config';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const clearError = () => setError(null);

  const formatError = (code: string): string => {
    const map: Record<string, string> = {
      'auth/user-not-found':       'No account found with this email.',
      'auth/wrong-password':       'Incorrect password. Please try again.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password':        'Password must be at least 6 characters.',
      'auth/invalid-email':        'Please enter a valid email address.',
      'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
      'auth/network-request-failed': 'Network error. Check your connection.',
      'auth/too-many-requests':    'Too many attempts. Please try again later.',
      'auth/invalid-credential':   'Invalid email or password.',
    };
    return map[code] || 'Something went wrong. Please try again.';
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      setError(formatError(e.code));
      throw e;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setError(null);
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName: name });
    } catch (e: any) {
      setError(formatError(e.code));
      throw e;
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (e: any) {
      setError(formatError(e.code));
      throw e;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (e: any) {
      setError(formatError(e.code));
      throw e;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, logout, resetPassword, error, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}
