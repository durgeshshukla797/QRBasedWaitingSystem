import React from 'react';

export default function StatusBadge({ status, type = 'queue', size = 'sm' }) {
  const norm = (status || '').toLowerCase();

  let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotClass = 'bg-slate-400';
  let label = status;

  if (type === 'queue') {
    switch (norm) {
      case 'open':
        colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        dotClass = 'bg-emerald-500';
        label = 'Open';
        break;
      case 'paused':
        colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
        dotClass = 'bg-amber-500';
        label = 'Paused';
        break;
      case 'closed':
        colorClass = 'bg-slate-100 text-slate-600 border-slate-200';
        dotClass = 'bg-slate-400';
        label = 'Closed';
        break;
      default:
        break;
    }
  } else {
    // entry statuses: waiting | notified | serving | served | skipped | cancelled | no_show
    switch (norm) {
      case 'waiting':
        colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
        dotClass = 'bg-blue-500';
        label = 'Waiting';
        break;
      case 'notified':
        colorClass = 'bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-400/20';
        dotClass = 'bg-amber-500 animate-pulse';
        label = 'Notified';
        break;
      case 'serving':
        colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500/20';
        dotClass = 'bg-emerald-500 animate-ping';
        label = 'Now Serving';
        break;
      case 'served':
        colorClass = 'bg-slate-50 text-slate-600 border-slate-200';
        dotClass = 'bg-emerald-600';
        label = 'Served';
        break;
      case 'skipped':
        colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
        dotClass = 'bg-rose-500';
        label = 'Skipped';
        break;
      case 'no_show':
        colorClass = 'bg-purple-50 text-purple-700 border-purple-200';
        dotClass = 'bg-purple-500';
        label = 'No-Show';
        break;
      case 'cancelled':
        colorClass = 'bg-slate-100 text-slate-500 border-slate-200';
        dotClass = 'bg-slate-400';
        label = 'Cancelled';
        break;
      default:
        break;
    }
  }

  const sizeClasses = size === 'lg' ? 'px-3 py-1 text-sm font-semibold' : 'px-2.5 py-0.5 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${colorClass} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      <span>{label}</span>
    </span>
  );
}
