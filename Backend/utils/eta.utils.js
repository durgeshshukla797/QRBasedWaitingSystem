import pool from '../db/db.js';

const SAMPLE_SIZE = 15;
const MIN_SAMPLES = 3; // don't replace the merchant's estimate until we have real data

export const updateAvgServiceTime = async (queueId) => {
  const [rows] = await pool.query(
    `SELECT AVG(sec) AS avgSec, COUNT(*) AS n
     FROM (
       SELECT TIMESTAMPDIFF(SECOND, called_at, completed_at) AS sec
       FROM queue_entries
       WHERE queue_id = ? AND status = 'served'
         AND called_at IS NOT NULL AND completed_at IS NOT NULL
       ORDER BY completed_at DESC
       LIMIT ?
     ) recent
     WHERE sec BETWEEN 10 AND 3600`,
    [queueId, SAMPLE_SIZE]
  );

  const { avgSec, n } = rows[0];
  if (!n || n < MIN_SAMPLES) return;

  const avgMin = Math.min(120, Math.max(1, Number(avgSec) / 60));
  await pool.query('UPDATE queues SET avg_service_min = ? WHERE id = ?', [
    avgMin.toFixed(2),
    queueId,
  ]);
};