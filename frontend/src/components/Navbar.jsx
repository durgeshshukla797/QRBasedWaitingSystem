import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { APP_NAME } from '../constants.js';
import { useAuth } from '../context/AuthContext.jsx';
import { LogOut, LayoutDashboard, QrCode, Store } from 'lucide-react';

export default function Navbar({ minimal = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link
          to={user ? '/dashboard' : '/'}
          className="flex items-center gap-2.5 text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <QrCode className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">
            {APP_NAME}
          </span>
        </Link>

        {/* Minimal header (e.g. for customer tickets) */}
        {minimal ? (
          <div className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            Virtual Ticket
          </div>
        ) : (
          <nav className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/browse"
              id="nav-browse-link"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-indigo-600 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <Store className="w-4 h-4 text-indigo-600" />
              <span>Browse Directory</span>
            </Link>

            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-indigo-600 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-slate-500" />
                  Dashboard
                </Link>
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-xs flex items-center justify-center">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'M'}
                  </div>
                  <span className="hidden md:inline text-sm font-medium text-slate-700 max-w-[140px] truncate">
                    {user.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                    title="Log out"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-700 hover:text-indigo-600 px-3 py-2 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg shadow-xs transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
