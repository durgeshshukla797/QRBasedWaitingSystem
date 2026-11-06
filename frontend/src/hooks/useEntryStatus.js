import { useState, useEffect, useRef, useCallback } from 'react';
import { request } from '../api.js';

const ACTIVE_STATUSES = ['waiting', 'notified', 'serving'];
const POLL_INTERVAL_MS = 5000;

/**
 * Custom hook to track customer ticket status in real-time
 * - Polls GET /api/entry/:entryKey every 5 seconds via a sequential setTimeout chain
 * - Skips polling when the tab/document is hidden
 * - Refreshes immediately on visibilitychange when tab becomes visible
 * - Automatically stops polling when entry status is finished (not waiting/notified/serving) or on 404
 * - Cleans up all timers and listeners on unmount
 */
export function useEntryStatus(entryKey) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const timeoutRef = useRef(null);
  const isMountedRef = useRef(true);
  const shouldPollRef = useRef(true);

  const fetchStatus = useCallback(
    async (isInitial = false) => {
      if (!entryKey) return;
      if (isInitial) setLoading(true);

      try {
        const data = await request(`/api/entry/${entryKey}`);
        if (!isMountedRef.current) return;

        setTicket(data);
        setError(null);
        setNotFound(false);

        // Stop polling if ticket reached a terminal status
        if (!ACTIVE_STATUSES.includes(data.status)) {
          shouldPollRef.current = false;
        }
      } catch (err) {
        if (!isMountedRef.current) return;

        if (err.status === 404) {
          setNotFound(true);
          shouldPollRef.current = false; // Stop polling on 404
        } else {
          setError(err.message || 'Unable to update status');
        }
      } finally {
        if (isMountedRef.current && isInitial) {
          setLoading(false);
        }
      }
    },
    [entryKey]
  );

  useEffect(() => {
    isMountedRef.current = true;
    shouldPollRef.current = true;

    const clearTimer = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    // Sequential setTimeout chain: schedules next poll only AFTER current poll completes
    const scheduleNextPoll = () => {
      clearTimer();
      if (!shouldPollRef.current || !isMountedRef.current) return;

      timeoutRef.current = setTimeout(async () => {
        if (!isMountedRef.current || !shouldPollRef.current) return;

        // Skip fetch while tab is hidden
        if (!document.hidden) {
          await fetchStatus(false);
        }

        // Continue chain if still active
        if (shouldPollRef.current && isMountedRef.current) {
          scheduleNextPoll();
        }
      }, POLL_INTERVAL_MS);
    };

    // Initial fetch, then start timeout chain
    (async () => {
      await fetchStatus(true);
      if (shouldPollRef.current && isMountedRef.current) {
        scheduleNextPoll();
      }
    })();

    // Refresh immediately when returning to tab
    const handleVisibilityChange = async () => {
      if (!document.hidden && isMountedRef.current && shouldPollRef.current) {
        clearTimer();
        await fetchStatus(false);
        if (shouldPollRef.current && isMountedRef.current) {
          scheduleNextPoll();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMountedRef.current = false;
      clearTimer();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [entryKey, fetchStatus]);

  const refresh = useCallback(() => {
    return fetchStatus(false);
  }, [fetchStatus]);

  return { ticket, loading, error, notFound, refresh };
}
