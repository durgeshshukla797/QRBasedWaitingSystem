import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { request, ApiError, getFieldError } from '../api.js';
import { APP_NAME } from '../constants.js';
import Navbar from '../components/Navbar.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import {
  Users,
  Clock,
  Phone,
  Mail,
  User,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Pause,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export default function JoinQueuePage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [queueInfo, setQueueInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [generalError, setGeneralError] = useState(null);

  // Two-step Form State
  const [step, setStep] = useState(1); // 1 = Details + OTP, 2 = Enter Code
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [otp, setOtp] = useState('');

  // Submitting & Countdown
  const [submittingOtp, setSubmittingOtp] = useState(false);
  const [submittingJoin, setSubmittingJoin] = useState(false);
  const [formError, setFormError] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpInputRef = useRef(null);

  // Check if existing ticket is active in localStorage
  const checkExistingTicket = useCallback(async () => {
    const savedEntryKey = localStorage.getItem(`queueease:entry:${slug}`);
    if (!savedEntryKey) return false;

    try {
      const entry = await request(`/api/entry/${savedEntryKey}`);
      const isActive = ['waiting', 'notified', 'serving'].includes(entry.status);
      if (isActive) {
        navigate(`/status/${savedEntryKey}`, { replace: true });
        return true;
      }
    } catch {
      // Key expired, remove it
      localStorage.removeItem(`queueease:entry:${slug}`);
    }
    return false;
  }, [slug, navigate]);

  // Load queue info
  useEffect(() => {
    let isMounted = true;

    async function init() {
      setLoading(true);
      setNotFound(false);
      setGeneralError(null);

      // First check existing ticket
      const hasActive = await checkExistingTicket();
      if (hasActive) return;

      try {
        const data = await request(`/api/q/${slug}`);
        if (isMounted) {
          setQueueInfo(data);
        }
      } catch (err) {
        if (isMounted) {
          if (err.status === 404) {
            setNotFound(true);
          } else {
            setGeneralError(err.message || 'Unable to load queue information');
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [slug, checkExistingTicket]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus OTP input when step 2 opens
  useEffect(() => {
    if (step === 2 && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [step]);

  // Normalizes Indian phone number
  const sanitizePhone = (val) => {
    return val.replace(/[\s-]/g, '').replace(/^(\+91|91|0)(?=\d{10}$)/, '');
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setFormError(null);

    const trimmedEmail = email.trim().toLowerCase();
    const cleanedPhone = sanitizePhone(phone);

    if (!consent) {
      setFormError({ message: 'Please agree to the notification consent checkbox' });
      return;
    }

    if (!/^[6-9]\d{9}$/.test(cleanedPhone)) {
      setFormError({
        message: 'Validation failed',
        details: [{ field: 'phone', message: 'Enter a valid 10-digit mobile number' }],
      });
      return;
    }

    setSubmittingOtp(true);
    try {
      await request(`/api/q/${slug}/otp`, {
        method: 'POST',
        body: { email: trimmedEmail },
      });
      setStep(2);
      setResendCooldown(60); // 60s cooldown
    } catch (err) {
      setFormError(err);
      if (err.status === 429) {
        setResendCooldown(60);
      }
    } finally {
      setSubmittingOtp(false);
    }
  };

  // Step 2: Join Queue
  const handleJoinQueue = async (e) => {
    e.preventDefault();
    setFormError(null);

    const cleanedPhone = sanitizePhone(phone);
    const cleanedOtp = otp.trim();

    if (cleanedOtp.length !== 6) {
      setFormError({ message: 'Enter the 6-digit verification code' });
      return;
    }

    setSubmittingJoin(true);
    try {
      const data = await request(`/api/q/${slug}/join`, {
        method: 'POST',
        body: {
          name: name.trim(),
          phone: cleanedPhone,
          email: email.trim().toLowerCase(),
          otp: cleanedOtp,
        },
      });

      // Save ticket in localStorage
      localStorage.setItem(`queueease:entry:${slug}`, data.entryKey);
      localStorage.setItem(`queueease:slug:${data.entryKey}`, slug);

      // Navigate to live status page
      navigate(`/status/${data.entryKey}`, { replace: true });
    } catch (err) {
      setFormError(err);
    } finally {
      setSubmittingJoin(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar minimal />
        <div className="flex-1 flex items-center justify-center p-4">
          <LoadingSpinner text="Finding queue details..." size="lg" />
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
            <h1 className="text-xl font-bold text-slate-900 mb-2">This queue does not exist</h1>
            <p className="text-sm text-slate-600 mb-6">
              The QR code or queue link may be invalid, or this queue has been removed.
            </p>
            <Link
              to="/"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-colors"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isPaused = queueInfo?.status === 'paused';
  const isClosed = queueInfo?.status === 'closed';
  const canJoin = queueInfo?.status === 'open';

  const nameError = getFieldError(formError, 'name');
  const phoneError = getFieldError(formError, 'phone');
  const emailError = getFieldError(formError, 'email');
  const otpError = getFieldError(formError, 'otp');
  const generalFormError = !nameError && !phoneError && !emailError && !otpError ? formError?.message : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar minimal />

      <main className="flex-1 flex flex-col justify-center items-center px-4 py-8 max-w-md w-full mx-auto">
        {/* Queue Overview Card */}
        <div className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden mb-6">
          <div className="p-6 text-center border-b border-slate-100 bg-linear-to-b from-indigo-50/40 to-white">
            <span className="text-xs uppercase tracking-wider font-bold text-indigo-600 block mb-1">
              Virtual Queue Check-in
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {queueInfo?.shopName || 'Shop'}
            </h1>
            <p className="text-sm font-semibold text-slate-600 mt-0.5">
              {queueInfo?.queueName || 'Queue'}
            </p>

            <div className="mt-3">
              <StatusBadge status={queueInfo?.status} type="queue" size="sm" />
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 divide-x divide-slate-100 bg-slate-50/60 p-3 text-center">
            <div className="p-2">
              <span className="text-2xs uppercase tracking-wider font-semibold text-slate-400 block mb-0.5">
                People in Line
              </span>
              <span className="text-xl font-extrabold text-slate-900 flex items-center justify-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                {queueInfo?.peopleInQueue ?? 0}
              </span>
            </div>
            <div className="p-2">
              <span className="text-2xs uppercase tracking-wider font-semibold text-slate-400 block mb-0.5">
                Estimated Wait
              </span>
              <span className="text-xl font-extrabold text-slate-900 flex items-center justify-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                ~{queueInfo?.estimatedWaitMin ?? 0}m
              </span>
            </div>
          </div>
        </div>

        {/* Warning if Paused or Closed */}
        {!canJoin && (
          <div
            className={`w-full p-4 mb-6 rounded-2xl border text-sm flex items-start gap-3 shadow-2xs ${
              isPaused
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-slate-100 border-slate-300 text-slate-800'
            }`}
          >
            {isPaused ? (
              <Pause className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-bold block">
                {isPaused ? 'Queue is currently paused' : 'Queue is currently closed'}
              </span>
              <p className="text-xs mt-0.5 opacity-90">
                {isPaused
                  ? 'The merchant has paused new entries. Please wait a moment for the line to resume.'
                  : 'New entries are not being accepted at this time.'}
              </p>
            </div>
          </div>
        )}

        {/* TWO STEP JOIN FORM */}
        {canJoin && (
          <div className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7">
            {generalFormError && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{generalFormError}</span>
              </div>
            )}

            {step === 1 ? (
              /* STEP 1: Details & Send Code */
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5" htmlFor="custName">
                    Your Full Name
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="custName"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ramesh Patel"
                      disabled={submittingOtp}
                      className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 transition-all ${
                        nameError
                          ? 'border-rose-300 focus:ring-rose-500/20'
                          : 'border-slate-300 focus:ring-indigo-500/20 focus:border-indigo-600'
                      }`}
                    />
                  </div>
                  {nameError && <p className="text-xs text-rose-600 mt-1 font-medium">{nameError}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5" htmlFor="custPhone">
                    Mobile Number (10 digits)
                  </label>
                  <div className="relative">
                    <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="custPhone"
                      type="tel"
                      required
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      disabled={submittingOtp}
                      className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 transition-all ${
                        phoneError
                          ? 'border-rose-300 focus:ring-rose-500/20'
                          : 'border-slate-300 focus:ring-indigo-500/20 focus:border-indigo-600'
                      }`}
                    />
                  </div>
                  {phoneError ? (
                    <p className="text-xs text-rose-600 mt-1 font-medium">{phoneError}</p>
                  ) : (
                    <p className="text-2xs text-slate-400 mt-1">Indian 10-digit mobile number</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5" htmlFor="custEmail">
                    Email Address (For Turn Alert)
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="custEmail"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      disabled={submittingOtp}
                      className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 transition-all ${
                        emailError
                          ? 'border-rose-300 focus:ring-rose-500/20'
                          : 'border-slate-300 focus:ring-indigo-500/20 focus:border-indigo-600'
                      }`}
                    />
                  </div>
                  {emailError && <p className="text-xs text-rose-600 mt-1 font-medium">{emailError}</p>}
                </div>

                {/* Consent Checkbox */}
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-xs text-slate-600 leading-normal select-none">
                      I agree to receive notifications about my turn and that my details are used only for this queue.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submittingOtp || !consent}
                  className="w-full mt-3 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submittingOtp ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending Verification Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* STEP 2: Code Verification */
              <form onSubmit={handleJoinQueue} className="space-y-5">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Enter Verification Code</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    We sent a 6-digit code to <span className="font-semibold text-slate-700">{email}</span>
                  </p>
                </div>

                <div>
                  <input
                    ref={otpInputRef}
                    id="otpInput"
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    autoComplete="one-time-code"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="••••••"
                    disabled={submittingJoin}
                    className={`w-full py-3.5 px-4 text-center font-mono tracking-widest text-2xl font-bold bg-slate-50 border rounded-2xl text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 transition-all ${
                      otpError
                        ? 'border-rose-300 focus:ring-rose-500/20'
                        : 'border-slate-300 focus:ring-indigo-500/20 focus:border-indigo-600'
                    }`}
                  />
                  {otpError && <p className="text-xs text-rose-600 mt-1.5 font-medium text-center">{otpError}</p>}
                </div>

                <button
                  type="submit"
                  disabled={submittingJoin || otp.length !== 6}
                  className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submittingJoin ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Securing Your Place...</span>
                    </>
                  ) : (
                    <>
                      <span>Join Queue Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setOtp('');
                    }}
                    className="text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                  >
                    &larr; Change Details
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    disabled={resendCooldown > 0 || submittingOtp}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="mt-8 text-center text-xs text-slate-400 max-w-xs flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
          <span>Your contact information is only used for live updates for this queue.</span>
        </div>
      </main>
    </div>
  );
}
