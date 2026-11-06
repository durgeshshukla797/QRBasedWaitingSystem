import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { request } from '../api.js';
import Navbar from '../components/Navbar.jsx';
import {
  Search,
  Store,
  Building2,
  MapPin,
  QrCode,
  ArrowRight,
  Layers,
  RotateCw,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export default function BrowsePage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all'); // 'all' | 'shop' | 'clinic'

  const [shops, setShops] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const LIMIT = 20;

  // 300ms debounce on search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch shops
  const fetchShops = useCallback(
    async (currentOffset = 0, isAppend = false) => {
      if (isAppend) {
        setLoadingMore(true);
      } else {
        setInitialLoading(true);
      }
      setError(null);

      try {
        const params = new URLSearchParams();
        if (debouncedSearch.trim()) {
          params.append('search', debouncedSearch.trim());
        }
        if (selectedType !== 'all') {
          params.append('type', selectedType);
        }
        params.append('limit', String(LIMIT));
        params.append('offset', String(currentOffset));

        const res = await request(`/api/shops?${params.toString()}`);
        const newShops = res?.shops || [];

        setShops((prev) => (isAppend ? [...prev, ...newShops] : newShops));
        setHasMore(Boolean(res?.hasMore));
        setOffset(currentOffset + newShops.length);
      } catch (err) {
        setError(err.message || 'Failed to load shops. Please try again.');
      } finally {
        setInitialLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch, selectedType]
  );

  // Trigger search on debounced search or filter change
  useEffect(() => {
    fetchShops(0, false);
  }, [fetchShops]);

  // Load more handler
  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchShops(offset, true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Live Virtual Directory
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Browse Shops & Clinics
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Find open queues nearby, check waiting counts, and grab your digital ticket without standing in line.
            </p>
          </div>

          <Link
            to="/scan"
            id="scan-qr-instead-btn"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-indigo-600 hover:text-indigo-700 border border-indigo-200 rounded-xl text-sm font-semibold shadow-2xs hover:shadow-xs transition-all shrink-0"
          >
            <QrCode className="w-4 h-4 text-indigo-600" />
            Scan QR instead
          </Link>
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs mb-8 space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="shop-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by shop or clinic name, street, area..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 px-1.5 py-0.5 rounded cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-sm font-medium">
            <span className="text-xs uppercase tracking-wider text-slate-600 font-bold mr-1 shrink-0">
              Filter:
            </span>
            {[
              { id: 'all', label: 'All Places' },
              { id: 'shop', label: 'Shops' },
              { id: 'clinic', label: 'Clinics' },
            ].map((chip) => {
              const active = selectedType === chip.id;
              return (
                <button
                  key={chip.id}
                  id={`filter-chip-${chip.id}`}
                  type="button"
                  onClick={() => setSelectedType(chip.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 border ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-100/80 hover:bg-slate-200 text-slate-700 border-transparent'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center my-6">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-rose-900 mb-1">Could not load shops</h3>
            <p className="text-sm text-rose-700 max-w-md mx-auto mb-4">{error}</p>
            <button
              type="button"
              id="retry-fetch-btn"
              onClick={() => fetchShops(0, false)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        )}

        {/* Initial Loading Skeletons */}
        {initialLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 animate-pulse flex flex-col justify-between h-40"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-6 w-3/5 bg-slate-200 rounded-md" />
                    <div className="h-5 w-16 bg-slate-200 rounded-full" />
                  </div>
                  <div className="h-4 w-4/5 bg-slate-100 rounded-md mb-2" />
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="h-4 w-24 bg-slate-200 rounded-md" />
                  <div className="h-4 w-12 bg-slate-200 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!initialLoading && !error && shops.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-14 text-center max-w-lg mx-auto shadow-xs my-8">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No shops found</h3>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              {searchTerm
                ? `No active places match "${searchTerm}". Try a different search term or clear filters.`
                : 'There are currently no listed shops with open queues. Check back shortly or scan a direct code.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedType('all');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Clear search
                </button>
              )}
              <Link
                to="/scan"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                Scan QR instead
              </Link>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {!initialLoading && !error && shops.length > 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shops.map((shop) => {
                const isClinic = shop.type === 'clinic';
                return (
                  <div
                    key={shop.id}
                    onClick={() => navigate(`/browse/${shop.id}`)}
                    className="group bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between text-left"
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/browse/${shop.id}`);
                      }
                    }}
                  >
                    <div>
                      {/* Top Bar: Name & Type Badge */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                            {isClinic ? (
                              <Building2 className="w-5 h-5" />
                            ) : (
                              <Store className="w-5 h-5" />
                            )}
                          </div>
                          <h2 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                            {shop.name}
                          </h2>
                        </div>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider shrink-0 ${
                            isClinic
                              ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                              : 'bg-violet-50 text-violet-700 border border-violet-200'
                          }`}
                        >
                          {isClinic ? 'Clinic' : 'Shop'}
                        </span>
                      </div>

                      {/* Address */}
                      <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5 line-clamp-2">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span>{shop.address || 'Address not listed'}</span>
                      </p>
                    </div>

                    {/* Footer: Queue count & Arrow */}
                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <Layers className="w-3.5 h-3.5 text-indigo-600" />
                        {shop.queueCount} {shop.queueCount === 1 ? 'queue' : 'queues'}
                      </span>

                      <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                        View Queues
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="pt-4 pb-8 text-center">
                <button
                  type="button"
                  id="load-more-shops-btn"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-300 rounded-xl font-semibold text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                      Loading more...
                    </>
                  ) : (
                    'Load more places'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
