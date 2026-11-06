import React from 'react';
import { Link } from 'react-router-dom';
import { APP_NAME } from '../constants.js';
import { useAuth } from '../context/AuthContext.jsx';
import Navbar from '../components/Navbar.jsx';
import { QrCode, BellRing, Smartphone, ShieldCheck, ArrowRight, Clock, Users, Store } from 'lucide-react';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-12 pb-16 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-6 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
          Virtual Queues Made Effortless
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight max-w-3xl leading-[1.15] mb-6">
          No more crowded waiting rooms. Just a simple{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
            QR code scan.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mb-8 leading-relaxed">
          {APP_NAME} lets clinics, salons, cafes, and retail shops eliminate physical lines. Customers scan a QR code to grab a virtual ticket, track their position in real-time, and get notified right when it’s their turn.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto mb-4">
          <Link
            to="/browse"
            id="hero-browse-shops-btn"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <Store className="w-5 h-5" />
            Browse shops
          </Link>
          <Link
            to="/scan"
            id="hero-scan-qr-btn"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-all shadow-xs"
          >
            <QrCode className="w-5 h-5 text-indigo-600" />
            Scan QR code
          </Link>
        </div>

        {/* Merchant Portal Prompt */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
          <span>Are you a business owner?</span>
          {user ? (
            <Link to="/dashboard" className="font-semibold text-indigo-600 hover:text-indigo-700 underline">
              Go to Merchant Dashboard &rarr;
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 underline">
                Merchant Sign In
              </Link>
              <span>•</span>
              <Link to="/signup" className="font-semibold text-indigo-600 hover:text-indigo-700 underline">
                Create Free Account
              </Link>
            </div>
          )}
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-16 text-left w-full">
          <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Instant QR Standees</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Generate printable QR codes in one click. Place them at your entrance or front desk for effortless self-checkin.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Live Mobile Ticket</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              No app download required. Customers view their live token number, queue position, and estimated wait on any phone.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all">
            <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-4">
              <BellRing className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Smart Turn Alerts</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Customers receive email and vibration alerts when their turn is coming up, keeping line movement punctual.
            </p>
          </div>
        </div>

        {/* 3 Step Workflow */}
        <div className="mt-16 w-full p-8 sm:p-10 bg-white border border-slate-200 rounded-3xl shadow-xs">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">How {APP_NAME} Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center mb-3 text-sm">
                1
              </div>
              <h4 className="font-semibold text-slate-900 mb-1">Create your Queue</h4>
              <p className="text-xs text-slate-500 max-w-xs">
                Set up your shop and customize average service times in seconds.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center mb-3 text-sm">
                2
              </div>
              <h4 className="font-semibold text-slate-900 mb-1">Customer Scans QR</h4>
              <p className="text-xs text-slate-500 max-w-xs">
                Visitors verify via OTP and grab their digital ticket without crowding.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center mb-3 text-sm">
                3
              </div>
              <h4 className="font-semibold text-slate-900 mb-1">Call Next & Serve</h4>
              <p className="text-xs text-slate-500 max-w-xs">
                Manage your line in real-time from your tablet, laptop, or phone screen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white">
        <p>&copy; {new Date().getFullYear()} {APP_NAME}. Simple, fast, privacy-friendly virtual queuing.</p>
      </footer>
    </div>
  );
}
