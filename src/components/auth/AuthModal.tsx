import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login, signup } = useAuth();
  const [isSignup, setIsSignup] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('alex.chen@prepforge.edu');
  const [password, setPassword] = useState<string>('prepforge2026');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignup) {
        if (!name.trim()) throw new Error('Please enter your full name');
        await signup(name, email, password);
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await login('alex.chen@prepforge.edu', 'prepforge2026');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in as demo student.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {isSignup ? 'Create PrepForge Account' : 'Welcome Back'}
            </h2>
            <p className="text-xs text-stone-500">
              {isSignup
                ? 'Start tracking your complete placement preparation journey'
                : 'Sign in to access your personal dashboard and revisions'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-lg text-xs">
              {error}
            </div>
          )}

          {isSignup && (
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-500 text-foreground"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@college.edu"
                className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-500 text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-500 text-foreground font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:text-stone-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isSignup ? (
              'Create Account'
            ) : (
              'Sign In'
            )}
          </button>

          <div className="relative my-3 text-center">
            <span className="bg-card px-2 text-[11px] text-stone-400 relative z-10">
              or
            </span>
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-border" />
          </div>

          <button
            type="button"
            onClick={handleDemoSignIn}
            className="w-full py-2 px-3 border border-border text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-stone-500" />
            <span>Sign In with Pre-loaded Demo Student</span>
          </button>
        </form>

        <div className="p-4 border-t border-border bg-stone-50/50 dark:bg-stone-900/30 text-center text-xs text-stone-500">
          {isSignup ? 'Already have an account?' : "Don't have an account yet?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsSignup(!isSignup);
              setError(null);
            }}
            className="font-semibold text-foreground hover:underline"
          >
            {isSignup ? 'Sign in' : 'Sign up'}
          </button>
        </div>
      </div>
    </div>
  );
}
