import React, { useState } from 'react';
import Modal from './Modal.jsx';
import { Copy, Check, Download, Printer, ExternalLink } from 'lucide-react';

export default function QrModal({ isOpen, onClose, queue, shopName }) {
  const [copied, setCopied] = useState(false);

  if (!queue) return null;

  const customerUrl = `${window.location.origin}/q/${queue.slug}`;
  const qrImageSrc = `/queues/${queue.id}/qr`;
  const qrDownloadUrl = `/queues/${queue.id}/qr?download=1`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(customerUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Customer QR Code" maxWidth="max-w-md">
      {/* Printable Card Area */}
      <div id="printable-qr-card" className="flex flex-col items-center text-center p-4">
        {/* Printable header */}
        <div className="mb-4">
          <span className="text-xs uppercase tracking-wider font-bold text-indigo-600 block mb-1">
            Scan to Join Virtual Queue
          </span>
          <h2 className="text-xl font-bold text-slate-900">{shopName || 'Our Shop'}</h2>
          <p className="text-sm font-medium text-slate-600">{queue.name}</p>
        </div>

        {/* QR image */}
        <div className="p-3 bg-white border-2 border-slate-200 rounded-2xl shadow-sm mb-4 inline-block">
          <img
            src={qrImageSrc}
            alt={`QR code for ${queue.name}`}
            className="w-56 h-56 object-contain block mx-auto rounded-lg"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(customerUrl);
            }}
          />
        </div>

        <p className="text-xs text-slate-500 mb-2">
          Point your camera here to get your live virtual ticket and updates.
        </p>

        {/* Display customer link */}
        <div className="w-full mt-2">
          <div className="flex items-center gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 overflow-hidden">
            <span className="truncate flex-1 text-left select-all">{customerUrl}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 hover:text-indigo-600 hover:border-indigo-300 font-sans font-medium text-xs shadow-2xs transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Action buttons (hidden when printing) */}
      <div className="no-print mt-6 grid grid-cols-3 gap-2.5 pt-4 border-t border-slate-100">
        <a
          href={customerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Test Link
        </a>

        <a
          href={qrDownloadUrl}
          download={`${queue.slug}-qr.png`}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
        >
          <Download className="w-4 h-4" />
          Download
        </a>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          Print Card
        </button>
      </div>
    </Modal>
  );
}
