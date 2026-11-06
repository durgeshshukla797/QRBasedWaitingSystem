import React from 'react';

export default function LoadingSpinner({ text = 'Loading...', size = 'md' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-7 h-7 border-3',
    lg: 'w-10 h-10 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 text-slate-500">
      <div
        className={`${sizeClasses[size] || sizeClasses.md} border-indigo-600 border-t-transparent rounded-full animate-spin mb-3`}
        role="status"
        aria-label="loading"
      />
      {text && <p className="text-sm font-medium text-slate-600">{text}</p>}
    </div>
  );
}
