import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { request, ApiError, getFieldError } from '../api.js';
import Navbar from '../components/Navbar.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import QrModal from '../components/QrModal.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import {
  Plus,
  Store,
  Clock,
  QrCode,
  Sliders,
  Trash2,
  Edit2,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Building2,
  Layers,
  MapPin,
} from 'lucide-react';

export default function DashboardPage() {
  const [shops, setShops] = useState([]);
  const [queuesByShop, setQueuesByShop] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Shop Modals State
  const [isAddShopOpen, setIsAddShopOpen] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [shopForm, setShopForm] = useState({ name: '', address: '', type: 'shop', isPublic: true });
  const [shopFormError, setShopFormError] = useState(null);
  const [shopSubmitting, setShopSubmitting] = useState(false);

  // Queue Modals State
  const [addQueueShopId, setAddQueueShopId] = useState(null);
  const [editingQueue, setEditingQueue] = useState(null);
  const [queueForm, setQueueForm] = useState({ name: '', avgServiceMin: 5 });
  const [queueFormError, setQueueFormError] = useState(null);
  const [queueSubmitting, setQueueSubmitting] = useState(false);

  // QR Modal State
  const [qrModalData, setQrModalData] = useState(null); // { queue, shopName }

  // Delete Confirm State
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    type: null, // 'shop' | 'queue'
    id: null,
    shopId: null, // needed if queue
    title: '',
    message: '',
    forceWarning: null,
    isForce: false,
    loading: false,
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load all shops and their queues
  const loadData = useCallback(async () => {
    setError(null);
    try {
      const shopList = await request('/shops');
      setShops(shopList || []);

      // Fetch queues for each shop
      const queueEntries = await Promise.all(
        (shopList || []).map(async (s) => {
          try {
            const qList = await request(`/shops/${s.id}/queues`);
            return [s.id, qList || []];
          } catch {
            return [s.id, []];
          }
        })
      );
      setQueuesByShop(Object.fromEntries(queueEntries));
    } catch (err) {
      setError(err.message || 'Failed to load shops');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Create / Edit Shop
  const handleOpenAddShop = () => {
    setShopForm({ name: '', address: '', type: 'shop', isPublic: true });
    setShopFormError(null);
    setIsAddShopOpen(true);
  };

  const handleOpenEditShop = (shop) => {
    setEditingShop(shop);
    setShopForm({
      name: shop.name || '',
      address: shop.address || '',
      type: shop.type || 'shop',
      isPublic: shop.isPublic !== undefined ? Boolean(shop.isPublic) : true,
    });
    setShopFormError(null);
  };

  const handleSaveShop = async (e) => {
    e.preventDefault();
    setShopSubmitting(true);
    setShopFormError(null);

    try {
      if (editingShop) {
        const updated = await request(`/shops/${editingShop.id}`, {
          method: 'PATCH',
          body: {
            name: shopForm.name.trim(),
            address: shopForm.address.trim() || null,
            type: shopForm.type,
            isPublic: Boolean(shopForm.isPublic),
          },
        });
        setShops((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        setEditingShop(null);
        showToast('Shop updated successfully');
      } else {
        const created = await request('/shops', {
          method: 'POST',
          body: {
            name: shopForm.name.trim(),
            address: shopForm.address.trim() || undefined,
            type: shopForm.type,
            isPublic: Boolean(shopForm.isPublic),
          },
        });
        setShops((prev) => [created, ...prev]);
        setQueuesByShop((prev) => ({ ...prev, [created.id]: [] }));
        setIsAddShopOpen(false);
        showToast('Shop created successfully');
      }
    } catch (err) {
      setShopFormError(err);
    } finally {
      setShopSubmitting(false);
    }
  };

  // Handle Delete Shop with 409 Force Confirm
  const handleDeleteShopPrompt = (shop) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'shop',
      id: shop.id,
      title: `Delete "${shop.name}"?`,
      message: 'Are you sure you want to delete this shop and all its queues?',
      forceWarning: null,
      isForce: false,
      loading: false,
    });
  };

  // Handle Create / Edit Queue
  const handleOpenAddQueue = (shopId) => {
    setAddQueueShopId(shopId);
    setQueueForm({ name: '', avgServiceMin: 5 });
    setQueueFormError(null);
  };

  const handleOpenEditQueue = (queue) => {
    setEditingQueue(queue);
    setQueueForm({
      name: queue.name || '',
      avgServiceMin: queue.avgServiceMin || 5,
    });
    setQueueFormError(null);
  };

  const handleSaveQueue = async (e) => {
    e.preventDefault();
    setQueueSubmitting(true);
    setQueueFormError(null);

    try {
      if (editingQueue) {
        const updated = await request(`/queues/${editingQueue.id}`, {
          method: 'PATCH',
          body: {
            name: queueForm.name.trim(),
            avgServiceMin: Number(queueForm.avgServiceMin),
          },
        });
        // Update in state
        setQueuesByShop((prev) => {
          const next = { ...prev };
          for (const sId in next) {
            next[sId] = next[sId].map((q) => (q.id === updated.id ? { ...q, ...updated } : q));
          }
          return next;
        });
        setEditingQueue(null);
        showToast('Queue updated successfully');
      } else {
        const created = await request(`/shops/${addQueueShopId}/queues`, {
          method: 'POST',
          body: {
            name: queueForm.name.trim(),
            avgServiceMin: Number(queueForm.avgServiceMin),
          },
        });
        setQueuesByShop((prev) => ({
          ...prev,
          [addQueueShopId]: [...(prev[addQueueShopId] || []), created],
        }));
        setAddQueueShopId(null);
        showToast('Queue created successfully');
      }
    } catch (err) {
      setQueueFormError(err);
    } finally {
      setQueueSubmitting(false);
    }
  };

  // Handle Delete Queue with 409 Force Confirm
  const handleDeleteQueuePrompt = (queue, shopId) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'queue',
      id: queue.id,
      shopId,
      title: `Delete "${queue.name}"?`,
      message: 'Are you sure you want to delete this queue?',
      forceWarning: null,
      isForce: false,
      loading: false,
    });
  };

  // Unified Confirm Delete Handler (handles 409 -> force delete)
  const handleConfirmDelete = async () => {
    const { type, id, shopId, isForce } = deleteConfirm;
    setDeleteConfirm((prev) => ({ ...prev, loading: true }));

    try {
      if (type === 'shop') {
        const url = isForce ? `/shops/${id}?force=true` : `/shops/${id}`;
        await request(url, { method: 'DELETE' });

        setShops((prev) => prev.filter((s) => s.id !== id));
        setQueuesByShop((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        setDeleteConfirm({ isOpen: false, type: null, id: null, loading: false });
        showToast('Shop deleted');
      } else if (type === 'queue') {
        const url = isForce ? `/queues/${id}?force=true` : `/queues/${id}`;
        await request(url, { method: 'DELETE' });

        setQueuesByShop((prev) => ({
          ...prev,
          [shopId]: (prev[shopId] || []).filter((q) => q.id !== id),
        }));
        setDeleteConfirm({ isOpen: false, type: null, id: null, loading: false });
        showToast('Queue deleted');
      }
    } catch (err) {
      if (err.status === 409 && !isForce) {
        // Active customers waiting! Show warning and offer force delete
        setDeleteConfirm((prev) => ({
          ...prev,
          loading: false,
          isForce: true,
          forceWarning: err.message,
          message: 'Customers are still in this line. Confirming will cancel them and delete immediately.',
          confirmText: 'Force Delete',
        }));
      } else {
        setDeleteConfirm({ isOpen: false, type: null, id: null, loading: false });
        showToast(err.message || 'Deletion failed', 'error');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Merchant Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your shops, customize waiting lines, and generate QR tickets
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddShop}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add New Shop
          </button>
        </div>

        {/* Feedback Toast */}
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
              <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
            )}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Global Error message */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={loadData}
              className="text-xs font-semibold text-rose-800 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <LoadingSpinner text="Loading your shops and queues..." size="lg" />
        ) : shops.length === 0 ? (
          /* Empty State - No Shops */
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-14 text-center max-w-xl mx-auto shadow-xs my-8">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-5 shadow-2xs">
              <Store className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">No shops added yet</h2>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Create your first shop or clinic location to set up self-service virtual queues and generate customer QR codes.
            </p>
            <button
              type="button"
              onClick={handleOpenAddShop}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Your First Shop
            </button>
          </div>
        ) : (
          /* List of Shops */
          <div className="space-y-8">
            {shops.map((shop) => {
              const shopQueues = queuesByShop[shop.id] || [];
              const isClinic = shop.type === 'clinic';

              return (
                <div
                  key={shop.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all hover:border-slate-300"
                >
                  {/* Shop Card Header */}
                  <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        {isClinic ? <Building2 className="w-6 h-6" /> : <Store className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h2 className="text-lg font-bold text-slate-900">{shop.name}</h2>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                              isClinic
                                ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                                : 'bg-violet-50 text-violet-700 border border-violet-200'
                            }`}
                          >
                            {shop.type || 'Shop'}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              shop.isPublic !== false
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-300'
                            }`}
                          >
                            {shop.isPublic !== false ? 'Listed' : 'Hidden'}
                          </span>
                        </div>
                        {shop.address && (
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            <span>{shop.address}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Shop Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleOpenAddQueue(shop.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Queue
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditShop(shop)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Edit Shop"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteShopPrompt(shop)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Shop"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Queues List inside Shop */}
                  <div className="p-5 sm:p-6">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        Active Waiting Lines ({shopQueues.length})
                      </h3>
                    </div>

                    {shopQueues.length === 0 ? (
                      <div className="py-8 px-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        <Clock className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs font-medium text-slate-600">No queues in this shop yet</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Add a queue (e.g., General Counter, Doctor Cabin) to start managing customers.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleOpenAddQueue(shop.id)}
                          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add your first queue
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden">
                        {shopQueues.map((queue) => (
                          <div
                            key={queue.id}
                            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                          >
                            {/* Queue Info */}
                            <div className="flex items-center gap-3">
                              <StatusBadge status={queue.status} type="queue" />
                              <div>
                                <span className="font-semibold text-slate-900 text-sm block">
                                  {queue.name}
                                </span>
                                <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  ~{queue.avgServiceMin || 5} min avg per customer
                                </span>
                              </div>
                            </div>

                            {/* Queue Action Buttons */}
                            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                              <Link
                                to={`/dashboard/queues/${queue.id}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                                Open Control Screen
                              </Link>

                              <button
                                type="button"
                                onClick={() => setQrModalData({ queue, shopName: shop.name })}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-700 text-xs font-medium rounded-lg shadow-2xs transition-colors cursor-pointer"
                                title="View Customer QR"
                              >
                                <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                                <span>QR Code</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditQueue(queue)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Edit Queue"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteQueuePrompt(queue, shop.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Queue"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL: Add / Edit Shop */}
      <Modal
        isOpen={isAddShopOpen || Boolean(editingShop)}
        onClose={() => {
          setIsAddShopOpen(false);
          setEditingShop(null);
        }}
        title={editingShop ? 'Edit Shop Location' : 'Add New Shop Location'}
      >
        <form onSubmit={handleSaveShop} className="space-y-4">
          {shopFormError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{shopFormError.message || 'Failed to save shop'}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1" htmlFor="shopName">
              Shop / Clinic Name *
            </label>
            <input
              id="shopName"
              type="text"
              required
              value={shopForm.name}
              onChange={(e) => setShopForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Apollo Pharmacy, City Salon"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
            {getFieldError(shopFormError, 'name') && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{getFieldError(shopFormError, 'name')}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1" htmlFor="shopType">
              Business Type *
            </label>
            <select
              id="shopType"
              value={shopForm.type}
              onChange={(e) => setShopForm((prev) => ({ ...prev, type: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer"
            >
              <option value="shop">Shop / Store / Cafe</option>
              <option value="clinic">Clinic / Healthcare</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1" htmlFor="shopAddress">
              Address (Optional)
            </label>
            <input
              id="shopAddress"
              type="text"
              value={shopForm.address}
              onChange={(e) => setShopForm((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="e.g. 102 Park Avenue, Floor 1"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
            {getFieldError(shopFormError, 'address') && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{getFieldError(shopFormError, 'address')}</p>
            )}
          </div>

          <div className="pt-2">
            <label className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition-colors cursor-pointer select-none">
              <input
                type="checkbox"
                id="shopIsPublic"
                checked={shopForm.isPublic}
                onChange={(e) => setShopForm((prev) => ({ ...prev, isPublic: e.target.checked }))}
                className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-900 block">
                  Show this shop in the public directory
                </span>
                <span className="text-slate-500 block mt-0.5">
                  When enabled, customers can discover your shop and active queues on the public browse directory.
                </span>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsAddShopOpen(false);
                setEditingShop(null);
              }}
              disabled={shopSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={shopSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {shopSubmitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {editingShop ? 'Save Changes' : 'Create Shop'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Add / Edit Queue */}
      <Modal
        isOpen={Boolean(addQueueShopId) || Boolean(editingQueue)}
        onClose={() => {
          setAddQueueShopId(null);
          setEditingQueue(null);
        }}
        title={editingQueue ? 'Edit Queue' : 'Add New Queue'}
      >
        <form onSubmit={handleSaveQueue} className="space-y-4">
          {queueFormError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{queueFormError.message || 'Failed to save queue'}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1" htmlFor="qName">
              Queue Name *
            </label>
            <input
              id="qName"
              type="text"
              required
              value={queueForm.name}
              onChange={(e) => setQueueForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Counter 1, Consultation Room, Takeaway"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
            {getFieldError(queueFormError, 'name') && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{getFieldError(queueFormError, 'name')}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1" htmlFor="qTime">
              Average Service Minutes Per Customer *
            </label>
            <input
              id="qTime"
              type="number"
              min="1"
              max="120"
              required
              value={queueForm.avgServiceMin}
              onChange={(e) => setQueueForm((prev) => ({ ...prev, avgServiceMin: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
            <p className="text-xs text-slate-400 mt-1">
              Used to calculate realistic wait time ETAs for customers (1 to 120 minutes).
            </p>
            {getFieldError(queueFormError, 'avgServiceMin') && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{getFieldError(queueFormError, 'avgServiceMin')}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setAddQueueShopId(null);
                setEditingQueue(null);
              }}
              disabled={queueSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={queueSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {queueSubmitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {editingQueue ? 'Save Changes' : 'Create Queue'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: QR Code Display */}
      {qrModalData && (
        <QrModal
          isOpen={Boolean(qrModalData)}
          onClose={() => setQrModalData(null)}
          queue={qrModalData.queue}
          shopName={qrModalData.shopName}
        />
      )}

      {/* MODAL: Deletion Confirmation (with force support) */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, type: null, id: null, loading: false })}
        onConfirm={handleConfirmDelete}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
        forceWarning={deleteConfirm.forceWarning}
        confirmText={deleteConfirm.confirmText || 'Delete'}
        loading={deleteConfirm.loading}
        isDestructive={true}
      />
    </div>
  );
}
