import React from 'react';
import Modal from './Modal.jsx';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  message = 'Are you sure you want to delete this item? This action cannot be undone.',
  confirmText = 'Delete',
  isDestructive = true,
  loading = false,
  forceWarning = null,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex gap-4">
        <div
          className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
            isDestructive ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
          }`}
        >
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
          {forceWarning && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
              {forceWarning}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`px-4 py-2 text-sm font-medium text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 ${
            isDestructive
              ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500'
              : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
          }`}
        >
          {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
