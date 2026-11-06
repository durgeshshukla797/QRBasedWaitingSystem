import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { request } from '../api.js';
import { useEntryStatus } from '../hooks/useEntryStatus.js';
import Navbar from '../components/Navbar.jsx';
import Modal from '../components/Modal.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import {
  Clock,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BellRing,
  Volume2,
  LogOut,
  Mail,
  RotateCcw,
  Store,
} from 'lucide-react';

export default function StatusPage() {
  const { entryKey } = useParams();
  const { ticket, loading, error: fetchError, notFound, refresh } = useEntryStatus(entryKey);

  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [actionError, setActionError] = useState(null);

  const hasVibratedRef = useRef(false);

  // Retrieve matching queue slug from localStorage
  const storedSlug = localStorage.getItem(`queueease:slug:${entryKey}`);

  // Haptic feedback vibration when status becomes 'serving'
  useEffect(() => {
    if (ticket?.status === 'serving' && !hasVibratedRef.current) {
      try {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([300, 150, 300, 150, 450]);
        }
      } catch {
        // Ignore if vibration permissions not available
      }
      hasVibratedRef.current = true;
    }
  }, [ticket?.status]);

  // Leave queue action
  const handleLeaveQueue = async () => {
    setLeaveLoading(true);
    setActionError(null);
    try {
      await request(`/api/entry/${entryKey}/leave`, { method: 'POST' });
      setLeaveModalOpen(false);
      // Clean up local storage
      if (storedSlug) {
        localStorage.removeItem(`queueease:entry:${storedSlug}`);
      }
      await refresh();
    } catch (err) {
      setActionError(err.message || 'Failed to leave the queue');
      setLeaveModalOpen(false);
    } finally {
      setLeaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar minimal />
        <div className="flex-1 flex items-center justify-center p-4">
          <LoadingSpinner text="Retrieving your ticket status..." size="lg" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar minimal />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200/90 shadow-sm text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">We could not find this ticket</h1>
            <p className="text-sm text-slate-600 mb-6">
              This ticket may have expired, or the link provided is incomplete.
            </p>
            <Link
              to="/"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const status = ticket?.status || 'waiting';
  const isWaiting = status === 'waiting';
  const isNotified = status === 'notified';
  const isServing = status === 'serving';
  const isServed = status === 'served';
  const isSkippedOrNoShow = status === 'skipped' || status === 'no_show';
  const isCancelled = status === 'cancelled';
  const isFinished = isServed || isSkippedOrNoShow || isCancelled;

  const canLeave = isWaiting || isNotified;

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${
      isServing ? 'bg-emerald-950/5' : 'bg-slate-50'
    }`}>
      <Navbar minimal />

      <main className="flex-1 flex flex-col justify-center items-center px-4 py-8 max-w-md w-full mx-auto">
        {(actionError || fetchError) && (
          <div className="w-full mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-700 flex items-center gap-2 shadow-2xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{actionError || fetchError}</span>
          </div>
        )}
        {/* SERVING FULL-SCREEN FEELING HIGHLIGHT BANNER */}
        {isServing && (
          <div className="w-full mb-6 p-6 bg-emerald-600 text-white rounded-3xl shadow-xl text-center animate-in zoom-in-95 duration-300">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 animate-bounce">
              <Volume2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-1">It is your turn now!</h2>
            <p className="text-sm font-medium text-emerald-50">
              Please head directly to the counter right now.
            </p>
          </div>
        )}

        {/* NOTIFIED UPCOMING TURN BANNER */}
        {isNotified && (
          <div className="w-full mb-6 p-4 sm:p-5 bg-amber-50 border-2 border-amber-300 text-amber-900 rounded-3xl shadow-sm flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <BellRing className="w-5 h-5 animate-wiggle" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Your turn is coming up soon!</h3>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                You are next in line. Please head towards the counter so you are ready when called.
              </p>
            </div>
          </div>
        )}

        {/* MAIN DIGITAL TICKET CARD */}
        <div className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden relative">
          {/* Top Ticket Header */}
          <div className="p-6 text-center border-b border-slate-100 bg-linear-to-b from-slate-50 to-white">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Store className="w-4 h-4 text-indigo-600" />
              <span className="text-xs uppercase tracking-wider font-extrabold text-slate-500">
                {ticket?.shopName || 'Shop'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{ticket?.queueName || 'Queue'}</h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Ticket for <span className="text-slate-800 font-bold">{ticket?.name}</span>
            </p>

            <div className="mt-3">
              <StatusBadge status={status} type="entry" size="lg" />
            </div>
          </div>

          {/* GIANT GLANCEABLE TOKEN NUMBER */}
          <div className="py-8 px-6 text-center border-b border-slate-100 bg-linear-to-b from-white to-slate-50/50">
            <span className="text-2xs uppercase tracking-wider font-extrabold text-slate-400 block mb-1">
              Your Token Number
            </span>
            <div className="text-6xl sm:text-7xl font-black text-slate-900 tracking-tight my-1">
              #{ticket?.token}
            </div>
          </div>

          {/* ACTIVE QUEUE STATS (Waiting / Notified) */}
          {(isWaiting || isNotified) && (
            <div className="grid grid-cols-2 divide-x divide-slate-100 p-4 bg-white text-center">
              <div className="p-2">
                <span className="text-2xs uppercase tracking-wider font-semibold text-slate-400 block mb-0.5">
                  Your Position
                </span>
                <span className="text-2xl font-black text-indigo-600 flex items-center justify-center gap-1">
                  <Users className="w-5 h-5" />
                  #{ticket?.position ?? 1}
                </span>
                <span className="text-2xs text-slate-500 font-medium">in current line</span>
              </div>

              <div className="p-2">
                <span className="text-2xs uppercase tracking-wider font-semibold text-slate-400 block mb-0.5">
                  Est. Wait Time
                </span>
                <span className="text-2xl font-black text-indigo-600 flex items-center justify-center gap-1">
                  <Clock className="w-5 h-5" />
                  ~{ticket?.estimatedWaitMin ?? 5}m
                </span>
                <span className="text-2xs text-slate-500 font-medium">approximate</span>
              </div>
            </div>
          )}

          {/* FINISHED STATES UI */}
          {isServed && (
            <div className="p-6 text-center bg-emerald-50/60">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
              <h3 className="text-lg font-bold text-slate-900">Thank you, you have been served!</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                We hope your service was quick and pleasant.
              </p>
            </div>
          )}

          {isSkippedOrNoShow && (
            <div className="p-6 text-center bg-amber-50/60">
              <XCircle className="w-12 h-12 text-amber-600 mx-auto mb-2" />
              <h3 className="text-lg font-bold text-slate-900">You were skipped</h3>
              <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
                Please speak with counter staff directly or join the queue again.
              </p>
            </div>
          )}

          {isCancelled && (
            <div className="p-6 text-center bg-slate-50">
              <XCircle className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <h3 className="text-lg font-bold text-slate-800">You left the queue</h3>
              <p className="text-xs text-slate-500 mt-1">
                Your ticket has been cancelled.
              </p>
            </div>
          )}

          {/* JOIN AGAIN LINK FOR FINISHED STATES */}
          {isFinished && storedSlug && (
            <div className="p-4 border-t border-slate-100 bg-white text-center">
              <Link
                to={`/q/${storedSlug}`}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Join This Queue Again
              </Link>
            </div>
          )}

          {/* LEAVE QUEUE BUTTON */}
          {canLeave && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-center">
              <button
                type="button"
                onClick={() => setLeaveModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer py-1.5 px-3"
              >
                <LogOut className="w-3.5 h-3.5" />
                Leave queue if you changed your mind
              </button>
            </div>
          )}
        </div>

        {/* Small Footer Notice */}
        <div className="mt-6 text-center text-xs text-slate-400 max-w-xs flex items-center justify-center gap-1.5">
          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>You will also get an email when your turn is near.</span>
        </div>
      </main>

      {/* Leave Queue Confirmation Modal */}
      <Modal
        isOpen={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        title="Leave the Queue?"
        maxWidth="max-w-sm"
      >
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Are you sure you want to give up your spot in line? You will lose token #{ticket?.token}.
        </p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setLeaveModalOpen(false)}
            disabled={leaveLoading}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Stay in Line
          </button>
          <button
            type="button"
            onClick={handleLeaveQueue}
            disabled={leaveLoading}
            className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {leaveLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Confirm Leave
          </button>
        </div>
      </Modal>
    </div>
  );
}
