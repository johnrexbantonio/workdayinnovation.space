"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, Mail, ChevronRight } from 'lucide-react';

export const AuthScreen = () => {
  const { login, signup } = useAuth();
  const [authStep, setAuthStep] = useState<'email' | 'pin'>('email');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setAuthStep('pin');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim() || pin.length < 4) {
      setError('PIN must be at least 4 characters.');
      return;
    }

    setLoading(true);
    setError('');

    // Try to login first
    let success = await login(email, pin);

    // If login fails (user might not exist), attempt signup
    if (!success) {
      success = await signup(email, pin, email.split('@')[0]);
      if (!success) {
        setError('Invalid PIN or account error. Please try again.');
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/20">
            <Lock className="text-white" size={32} />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Training Manager
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Enterprise access management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">

          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          {authStep === 'email' ? (
            <form className="space-y-6" onSubmit={handleNext}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Corporate Email
                </label>
                <div className="mt-2 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full pl-10 px-3 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow"
                    placeholder="you@ibm.com"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleAuth}>
              <div className="flex items-center justify-between mb-4 bg-slate-50 p-3 rounded-lg">
                <span className="text-sm font-medium text-slate-600">{email}</span>
                <button
                  type="button"
                  onClick={() => setAuthStep('email')}
                  className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                >
                  Change
                </button>
              </div>

              <div>
                <label htmlFor="pin" className="block text-sm font-medium text-slate-700">
                  Security PIN
                </label>
                <div className="mt-2">
                  <input
                    id="pin"
                    name="pin"
                    type="password"
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="appearance-none block w-full px-3 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-center tracking-[1em] font-mono text-xl"
                    placeholder="••••"
                    maxLength={8}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500 text-center">
                  Enter your PIN. New users will be automatically registered.
                </p>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Authenticating...' : 'Sign In securely'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
