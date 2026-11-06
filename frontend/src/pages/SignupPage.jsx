import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { APP_NAME } from '../constants.js';
import { getFieldError } from '../api.js';
import { Lock, Mail, User, QrCode, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const { user, signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signup({ name, email, password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const nameError = getFieldError(error, 'name');
  const emailError = getFieldError(error, 'email');
  const passwordError = getFieldError(error, 'password');
  const generalError = !nameError && !emailError && !passwordError ? error?.message : null;

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-slate-50">
      {/* Brand logo */}
      <Link to="/" className="flex items-center gap-2.5 text-indigo-600 mb-8">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
          <QrCode className="w-6 h-6" />
        </div>
        <span className="font-bold text-2xl tracking-tight text-slate-900">
          {APP_NAME}
        </span>
      </Link>

      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 shadow-md p-6 sm:p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Merchant Account</h1>
          <p className="text-sm text-slate-500 mt-1">
            Start managing queues for your shop, cafe, or clinic
          </p>
        </div>

        {generalError && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
            <span>{generalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5" htmlFor="name">
              Your Full Name
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Rajesh Sharma"
                disabled={loading}
                className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 transition-all ${
                  nameError
                    ? 'border-rose-300 focus:ring-rose-500/20'
                    : 'border-slate-300 focus:ring-indigo-500/20 focus:border-indigo-600'
                }`}
              />
            </div>
            {nameError && <p className="text-xs text-rose-600 mt-1 font-medium">{nameError}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5" htmlFor="email">
              Work / Business Email
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="clinic@example.com"
                disabled={loading}
                className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 transition-all ${
                  emailError
                    ? 'border-rose-300 focus:ring-rose-500/20'
                    : 'border-slate-300 focus:ring-indigo-500/20 focus:border-indigo-600'
                }`}
              />
            </div>
            {emailError && <p className="text-xs text-rose-600 mt-1 font-medium">{emailError}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                disabled={loading}
                className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 transition-all ${
                  passwordError
                    ? 'border-rose-300 focus:ring-rose-500/20'
                    : 'border-slate-300 focus:ring-indigo-500/20 focus:border-indigo-600'
                }`}
              />
            </div>
            {passwordError ? (
              <p className="text-xs text-rose-600 mt-1 font-medium">{passwordError}</p>
            ) : (
              <p className="text-xs text-slate-400 mt-1">Must be at least 8 characters long</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500 border-t border-slate-100 pt-5">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
