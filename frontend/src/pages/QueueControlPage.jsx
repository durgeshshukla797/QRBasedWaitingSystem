import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { request, ApiError } from '../api.js';
import Navbar from '../components/Navbar.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import {
  ArrowLeft,
  Phone,
  Clock,
  Users,
  CheckCircle2,
  FastForward,
  UserX,
  Play,
  Pause,
  AlertTriangle,
  Radio,
  Check,
  AlertCircle,
  Volume2,
} from 'lucide-react';

function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const past = new Date(dateString);
  const diffMin = Math.max(0, Math.floor((now - past) / 60000));
  if (diffMin < 1) return 'Just joined';
  if (diffMin === 1) return '1 min ago';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHours = Math.floor(diffMin / 60);
  return `${diffHours}h ${diffMin % 60}m ago`;
}

export default function QueueControlPage() {
  const { queueId } = useParams();

  const [queue, setQueue] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [toast, setToast] = useState(null);

  const isMountedRef = useRef(true);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      if (isMountedRef.current) setToast(null);
    }, 4000);
  };

  // Fetch live entries
  const fetchEntries = useCallback(async (showFullLoading = false) => {
    if (showFullLoading) setLoading(true);
    setActionError(null);

    try {
      const data = await request(`/queues/${queueId}/entries`);
      if (isMountedRef.current) {
        setQueue(data.queue);
        setEntries(data.entries || []);
        setError(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message || 'Failed to load queue entries');
      }
    } finally {
      if (isMountedRef.current && showFullLoading) {
        setLoading(false);
      }
    }
  }, [queueId]);

  // Initial load and 5-second polling with visibility handler
  useEffect(() => {
    isMountedRef.current = true;
    fetchEntries(true);

    let intervalId = null;

    const startPolling = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => {
        if (document.visibilityState === 'visible') {
          fetchEntries(false);
        }
      }, 5000);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchEntries(false);
        startPolling();
      } else {
        if (intervalId) clearInterval(intervalId);
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMountedRef.current = false;
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchEntries]);

  // Status Change: Open, Paused, Closed
  const handleStatusChange = async (newStatus) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await request(`/queues/${queueId}/status`, {
        method: 'PATCH',
        body: { status: newStatus },
      });
      setQueue((prev) => ({ ...prev, status: newStatus }));
      showToast(`Queue is now ${newStatus}`);
      await fetchEntries(false);
    } catch (err) {
      setActionError(err.message || 'Failed to update queue status');
    } finally {
      setActionLoading(false);
    }
  };

  // Call Next Customer
  const handleCallNext = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      const data = await request(`/queues/${queueId}/next`, {
        method: 'POST',
      });
      showToast(data.message || `Now serving ticket #${data.entry?.token}`);
      await fetchEntries(false);
    } catch (err) {
      setActionError(err.message || 'Could not call next customer');
    } finally {
      setActionLoading(false);
    }
  };

  // Complete Serving Entry
  const handleComplete = async (entryId) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const data = await request(`/queues/${queueId}/entries/${entryId}/complete`, {
        method: 'POST',
      });
      showToast(data.message || 'Customer marked as served');
      await fetchEntries(false);
    } catch (err) {
      setActionError(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Skip Entry
  const handleSkip = async (entryId) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const data = await request(`/queues/${queueId}/entries/${entryId}/skip`, {
        method: 'POST',
      });
      showToast(data.message || 'Customer skipped');
      await fetchEntries(false);
    } catch (err) {
      setActionError(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Mark No-Show (only valid for current serving entry)
  const handleNoShow = async (entryId) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const data = await request(`/queues/${queueId}/entries/${entryId}/no-show`, {
        method: 'POST',
      });
      showToast(data.message || 'Marked as no-show');
      await fetchEntries(false);
    } catch (err) {
      setActionError(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Derived state: currently serving entry and waiting entries
  const servingEntry = entries.find((e) => e.status === 'serving');
  const waitingEntries = entries.filter((e) => e.status === 'waiting' || e.status === 'notified');

  const isPaused = queue?.status === 'paused';
  const isClosed = queue?.status === 'closed';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Back Link & Header */}
        <div className="mb-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {queue?.name || 'Queue Control'}
              </h1>
              {queue && <StatusBadge status={queue.status} type="queue" size="lg" />}
            </div>

            {/* Quick Status Controls */}
            {queue && (
              <div className="inline-flex items-center p-1 bg-white border border-slate-200 rounded-xl shadow-2xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleStatusChange('open')}
                  disabled={actionLoading || queue.status === 'open'}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    queue.status === 'open'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  Open
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('paused')}
                  disabled={actionLoading || queue.status === 'paused'}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    queue.status === 'paused'
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
                  }`}
                >
                  Pause
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('closed')}
                  disabled={actionLoading || queue.status === 'closed'}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    queue.status === 'closed'
                      ? 'bg-slate-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status Warning Banners */}
        {isPaused && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-center gap-3 text-amber-900 shadow-2xs">
            <Pause className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-sm">
              <span className="font-bold">Queue is currently paused.</span> Customers cannot join, and calling next customers is suspended. Resume the queue when ready.
            </div>
          </div>
        )}

        {isClosed && (
          <div className="mb-6 p-4 bg-slate-200 border border-slate-300 rounded-2xl flex items-center gap-3 text-slate-800 shadow-2xs">
            <AlertTriangle className="w-5 h-5 text-slate-600 shrink-0" />
            <div className="text-sm">
              <span className="font-bold">Queue is closed.</span> Customers cannot join. You can clear remaining entries or re-open the queue.
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium shadow-xs animate-in fade-in duration-150 ${
              toast.type === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            ) : (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            )}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Action Error Message */}
        {actionError && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Global Fetch Error */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => fetchEntries(true)}
              className="text-xs font-semibold text-rose-800 underline hover:no-underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <LoadingSpinner text="Connecting to live queue stream..." size="lg" />
        ) : (
          <div className="space-y-6">
            {/* PROMINENT NOW SERVING CARD */}
            <div className="bg-white rounded-3xl border-2 border-indigo-200 shadow-md p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-50/50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-wider font-extrabold text-indigo-600 flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                  Currently Serving
                </span>
                {servingEntry && (
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Called {formatTimeAgo(servingEntry.calledAt)}
                  </span>
                )}
              </div>

              {servingEntry ? (
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Token & Info */}
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-indigo-600 text-white font-extrabold text-3xl sm:text-4xl flex items-center justify-center shadow-md">
                      #{servingEntry.token}
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{servingEntry.name}</h2>
                      {servingEntry.phone && (
                        <a
                          href={`tel:${servingEntry.phone}`}
                          className="text-sm font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 mt-1 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{servingEntry.phone}</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Actions for current customer */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleComplete(servingEntry.id)}
                      disabled={actionLoading}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Complete Service
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSkip(servingEntry.id)}
                      disabled={actionLoading}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <FastForward className="w-4 h-4 text-slate-500" />
                      Skip
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNoShow(servingEntry.id)}
                      disabled={actionLoading}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 font-medium text-sm rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <UserX className="w-4 h-4" />
                      No-Show
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-slate-500">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-slate-700 text-base">Nobody is currently being served</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Click "Call Next Customer" below to serve the next ticket in line.
                  </p>
                </div>
              )}
            </div>

            {/* CALL NEXT BIG BUTTON */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleCallNext}
                disabled={actionLoading || Boolean(servingEntry) || isPaused || isClosed || waitingEntries.length === 0}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {actionLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Calling Next...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-5 h-5" />
                    <span>Call Next Customer</span>
                  </>
                )}
              </button>

              {servingEntry && (
                <p className="text-xs text-slate-500 mt-2 font-medium">
                  Complete or skip ticket #{servingEntry.token} before calling the next person.
                </p>
              )}
            </div>

            {/* WAITING LIST SECTION */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">Waiting List</h3>
                  <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
                    {waitingEntries.length} waiting
                  </span>
                </div>
                <span className="text-xs text-slate-400">Auto-refreshing every 5s</span>
              </div>

              {waitingEntries.length === 0 ? (
                <div className="py-12 px-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold text-slate-800 text-base">No customers currently waiting</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    When visitors scan your QR code or join the link, their tickets will appear in this list in real-time.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {waitingEntries.map((entry, index) => {
                    const isNotified = entry.status === 'notified';

                    return (
                      <div
                        key={entry.id}
                        className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                          isNotified ? 'bg-amber-50/40' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-800 font-bold text-base flex items-center justify-center shrink-0">
                            #{entry.token}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-slate-900 text-sm">
                                {entry.name}
                              </span>
                              {isNotified && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-2xs font-bold uppercase tracking-wider">
                                  Notified
                                </span>
                              )}
                              <span className="text-2xs text-slate-400 font-medium">
                                #{index + 1} in line
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                              {entry.phone && (
                                <a
                                  href={`tel:${entry.phone}`}
                                  className="hover:text-indigo-600 flex items-center gap-1 transition-colors"
                                >
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span>{entry.phone}</span>
                                </a>
                              )}
                              <span className="flex items-center gap-1 text-slate-400">
                                <Clock className="w-3 h-3" />
                                {formatTimeAgo(entry.joinedAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Skip button for waiting entry */}
                        <div className="self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleSkip(entry.id)}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            title="Skip this customer"
                          >
                            <FastForward className="w-3.5 h-3.5" />
                            <span>Skip</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
