import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { ArrowLeft, HelpCircle } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">404 - Page Not Found</h1>
        <p className="text-sm text-slate-600 max-w-sm mb-6">
          The page or queue link you are looking for does not exist or may have been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </main>
    </div>
  );
}
