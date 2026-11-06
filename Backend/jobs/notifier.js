import cron from 'node-cron';
import pool from '../db/db.js';
import { notifyUpcoming } from '../services/notification.services.js';

const NOTIFY_WITHIN_MIN = 10;

// Check one queue: notify waiting customers who are close to their turn.
// Returns true if at least one customer was notified.
export const checkQueue = async (queueId) => {
  // only open queues: a paused queue freezes ETAs, so nobody is notified
  const [qRows] = await pool.query(
    "SELECT avg_service_min FROM queues WHERE id = ? AND status = 'open'",
    [queueId]
  );
  if (!qRows[0]) return false;

  const avg = Number(qRows[0].avg_service_min) || 5;
  const limit = Math.ceil(NOTIFY_WITHIN_MIN / avg) + 3;

  // only the front of the line matters, so never load the whole queue
  const [front] = await pool.query(
    `SELECT id, status
     FROM queue_entries
     WHERE queue_id = ? AND status IN ('waiting', 'notified', 'serving')
     ORDER BY token_no
     LIMIT ?`,
    [queueId, limit]
  );

  let changed = false;

  // a customer's index in this list = how many people are ahead of them
  for (let ahead = 0; ahead < front.length; ahead++) {
    const entry = front[ahead];
    if (entry.status !== 'waiting') continue;

    const etaMin = ahead * avg;
    // fallback rule: also notify when only one person is ahead
    if (etaMin <= NOTIFY_WITHIN_MIN || ahead <= 1) {
      const claimed = await notifyUpcoming(entry.id, { etaMin: Math.round(etaMin) });
      if (claimed) changed = true;
    }
  }

  return changed;
};

// Call this after ANY change to a queue (call next, complete, skip, leave, pause, edit).
// It never throws, so callers can fire and forget.
export const refreshQueue = async (queueId) => {
  try {
    await checkQueue(queueId);
  } catch (err) {
    console.error('refreshQueue failed:', err);
  }
};

let running = false;

const checkAllQueues = async () => {
  if (running) return; // don't start a new run while the last one is still going
  running = true;
  try {
    const [queues] = await pool.query(
      `SELECT DISTINCT q.id
       FROM queues q
       JOIN queue_entries e ON e.queue_id = q.id AND e.status = 'waiting'
       WHERE q.status = 'open'`
    );
    for (const q of queues) {
      await checkQueue(q.id);
    }
  } catch (err) {
    console.error('Notifier run failed:', err);
  } finally {
    running = false;
  }
};

export const startNotifier = () => {
  cron.schedule('* * * * *', checkAllQueues); // every minute, as a safety net
  console.log('Notifier started (runs every minute)');
};