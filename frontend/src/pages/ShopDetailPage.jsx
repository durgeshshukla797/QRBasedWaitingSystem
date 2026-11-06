import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { request } from '../api.js';
import Navbar from '../components/Navbar.jsx';
import {
  Store,
  Building2,
  MapPin,
  Clock,
  Users,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  PauseCircle,
  PlayCircle,
  RefreshCw,
} from 'lucide-react';

export default function ShopDetailPage() {
  const { shopId } = useParams();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isNotFound, setIsNotFound] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchShop = useCallback(
    async (isBackground = false) => {
      if (!isBackground) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      try {
        const data = await request(`/api/shops/${shopId}`);
        setShop(data);
        setIsNotFound(false);
        setLastUpdated(new Date());
      } catch (err) {
        if (err.status === 404) {
          setIsNotFound(true);
        } else {
          setError(err.message || 'Could not load shop details');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [shopId]
  );

  // Initial load + 15 second polling while tab is visible
  useEffect(() => {
    let timeoutId = null;
    let isCancelled = false;

    fetchShop(false);

    const scheduleNext = () => {
      timeoutId = setTimeout(async () => {
        if (isCancelled) return;
        if (!document.hidden && !isNotFound) {
          await fetchShop(true);
        }
        if (!isCancelled && !isNotFound) {
          scheduleNext();
        }
      }, 15000);
    };

    const handleVisibility = () => {
      if (!document.hidden && !isCancelled && !isNotFound) {
        fetchShop(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    scheduleNext();

    return () => {
      isCancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchShop, isNotFound]);

  // 404 Not Found State
  if (isNotFound) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/90 shadow-xs max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">This shop is not available</h1>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              The shop you requested does not exist, has been removed, or is not currently listed in the public directory.
            </p>
            <Link
              to="/browse"
              id="back-to-browse-404-btn"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Browse Directory
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const isClinic = shop?.type === 'clinic';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            to="/browse"
            id="back-to-browse-link"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Directory
          </Link>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 animate-pulse">
              <div className="h-7 w-2/5 bg-slate-200 rounded-md mb-3" />
              <div className="h-4 w-3/5 bg-slate-100 rounded-md mb-2" />
            </div>
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-white p-6 rounded-2xl border border-slate-200/80 animate-pulse h-32"
                />
              ))}
            </div>
          </div>
        )}

        {/* General Error (non-404) */}
        {!loading && error && (
          <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center my-6">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-rose-900 mb-1">Could not load shop</h3>
            <p className="text-sm text-rose-700 max-w-md mx-auto mb-4">{error}</p>
            <button
              type="button"
              onClick={() => fetchShop(false)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        )}

        {/* Loaded Shop Content */}
        {!loading && shop && (
          <div className="space-y-8">
            {/* Shop Header Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    {isClinic ? <Building2 className="w-7 h-7" /> : <Store className="w-7 h-7" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        {shop.name}
                      </h1>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                          isClinic
                            ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                            : 'bg-violet-50 text-violet-700 border border-violet-200'
                        }`}
                      >
                        {shop.type || 'Shop'}
                      </span>
                    </div>

                    {shop.address && (
                      <p className="text-sm text-slate-500 mt-2 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 shrink-0 text-slate-400" />
                        <span>{shop.address}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Auto-refresh indicator */}
                <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-slate-600">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      refreshing ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'
                    }`}
                  />
                  <span>Live updates (15s)</span>
                </div>
              </div>
            </div>

            {/* Queues Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">
                  Available Queues ({shop.queues?.length || 0})
                </h2>
                <span className="text-xs text-slate-600">
                  Select a queue to receive your digital ticket
                </span>
              </div>

              {!shop.queues || shop.queues.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200/80 text-center shadow-xs">
                  <p className="text-sm text-slate-600">
                    No active queues are currently accepting tickets for this shop.
                  </p>
                  <Link
                    to="/browse"
                    className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Browse other shops
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {shop.queues.map((q) => {
                    const isOpen = q.status === 'open';
                    const isPaused = q.status === 'paused';

                    return (
                      <div
                        key={q.slug}
                        className={`bg-white p-5 sm:p-6 rounded-2xl border transition-all ${
                          isOpen
                            ? 'border-slate-200/90 shadow-xs hover:border-indigo-300'
                            : 'border-slate-200/60 bg-slate-50/60'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                          {/* Left: Queue Info */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="text-lg font-bold text-slate-900">{q.name}</h3>
                              {isOpen ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Open
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                  <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
                                  Paused
                                </span>
                              )}
                            </div>

                            {/* People waiting & Wait time */}
                            <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-600 flex-wrap">
                              <span className="inline-flex items-center gap-1.5">
                                <Users className="w-4 h-4 text-slate-600" />
                                <strong className="text-slate-800">{q.peopleInQueue}</strong>{' '}
                                {q.peopleInQueue === 1 ? 'person waiting' : 'people waiting'}
                              </span>

                              <span className="text-slate-300">•</span>

                              <span className="inline-flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-slate-600" />
                                <span>about</span>
                                <strong className="text-slate-800">
                                  {q.estimatedWaitMin} min
                                </strong>
                              </span>
                            </div>
                          </div>

                          {/* Right: Join Button */}
                          <div className="shrink-0">
                            {isOpen ? (
                              <Link
                                to={`/q/${q.slug}`}
                                id={`join-queue-btn-${q.slug}`}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors"
                              >
                                <span>Join queue</span>
                                <ArrowRight className="w-4 h-4" />
                              </Link>
                            ) : (
                              <button
                                type="button"
                                disabled
                                id={`paused-queue-btn-${q.slug}`}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-100 text-slate-400 font-semibold text-sm rounded-xl cursor-not-allowed border border-slate-200"
                              >
                                <PauseCircle className="w-4 h-4" />
                                <span>Queue Paused</span>
                              </button>
                            )}
                          </div>
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
