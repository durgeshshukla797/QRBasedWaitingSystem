import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import {
  QrCode,
  Camera,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Store,
  Sparkles,
} from 'lucide-react';

export default function ScanPage() {
  const navigate = useNavigate();
  const [slugInput, setSlugInput] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const handleJoinBySlug = (e) => {
    e.preventDefault();
    if (!slugInput.trim()) return;

    let targetSlug = slugInput.trim();
    // In case user pasted a full URL like http://.../q/counter-queue-xyz
    if (targetSlug.includes('/q/')) {
      targetSlug = targetSlug.split('/q/')[1].split(/[?#/]/)[0];
    }

    navigate(`/q/${encodeURIComponent(targetSlug)}`);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);

      // Check if native BarcodeDetector API exists
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const intervalId = setInterval(async () => {
          if (!videoRef.current || !streamRef.current) {
            clearInterval(intervalId);
            return;
          }
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes && barcodes.length > 0) {
              const rawValue = barcodes[0].rawValue;
              clearInterval(intervalId);
              stopCamera();
              if (rawValue.includes('/q/')) {
                const slug = rawValue.split('/q/')[1].split(/[?#/]/)[0];
                navigate(`/q/${encodeURIComponent(slug)}`);
              } else {
                setSlugInput(rawValue);
              }
            }
          } catch {
            // Ignore frame detection errors
          }
        }, 500);
      }
    } catch (err) {
      setCameraError(err.message || 'Unable to access camera.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-8 flex flex-col items-center justify-center">
        <div className="w-full bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs text-center">
          {/* Header Icon */}
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-8 h-8" />
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Scan QR Code</h1>
          <p className="text-sm text-slate-600 mb-6">
            Scan the QR standee at the shop counter or enter the queue code printed below it.
          </p>

          {/* Camera Scanner View */}
          {cameraActive ? (
            <div className="mb-6 relative rounded-2xl overflow-hidden bg-black aspect-square max-w-xs mx-auto border-2 border-indigo-500">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-8 border-2 border-dashed border-white/80 rounded-xl pointer-events-none animate-pulse" />
              <button
                type="button"
                onClick={stopCamera}
                className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/70 hover:bg-black/90 text-white text-xs font-semibold rounded-full backdrop-blur-xs transition-colors cursor-pointer"
              >
                Close Camera
              </button>
            </div>
          ) : (
            <div className="mb-6">
              <button
                type="button"
                onClick={startCamera}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm rounded-xl border border-indigo-200 transition-colors cursor-pointer"
              >
                <Camera className="w-5 h-5" />
                <span>Open Camera Scanner</span>
              </button>
            </div>
          )}

          {cameraError && (
            <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Or enter queue code manually
            </span>
          </div>

          {/* Manual Input Form */}
          <form onSubmit={handleJoinBySlug} className="space-y-4">
            <div>
              <input
                type="text"
                value={slugInput}
                onChange={(e) => setSlugInput(e.target.value)}
                placeholder="e.g. counter-1-8a6fd6 or queue link"
                className="w-full px-4 py-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-center"
              />
            </div>

            <button
              type="submit"
              disabled={!slugInput.trim()}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <span>Go to Queue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Link back to browse directory */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs">
            <Link
              to="/browse"
              className="inline-flex items-center gap-1.5 font-semibold text-indigo-600 hover:text-indigo-700"
            >
              <Store className="w-4 h-4" />
              Browse shop directory instead
            </Link>
            <Link
              to="/"
              className="text-slate-500 hover:text-slate-700"
            >
              Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
