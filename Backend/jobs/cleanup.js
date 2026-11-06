//This covers the privacy promise: 
//customer names, phones and emails don’t stay in your database forever.
import cron from 'node-cron';
import pool from '../db/db.js';

const RETENTION_DAYS = 30;

const run = async (label, sql, params = []) => {
  try {
    const [r] = await pool.query(sql, params);
    if (r.affectedRows) console.log(`Cleanup: ${label}: ${r.affectedRows}`);
  } catch (err) {
    console.error(`Cleanup failed (${label}):`, err.message);
  }
};

export const startCleanup = () => {
  // expired codes, every hour
  cron.schedule('0 * * * *', () =>
    run('expired otps', 'DELETE FROM otps WHERE expires_at < NOW()')
  );

  // daily at 3 AM
  cron.schedule('0 3 * * *', async () => {
    // people left waiting from a previous day (merchant closed without clearing)
    await run(
      'stale waiting entries',
      `UPDATE queue_entries SET status = 'cancelled', completed_at = NOW()
       WHERE status IN ('waiting', 'notified') AND joined_at < NOW() - INTERVAL 1 DAY`
    );
    // finished entries past retention (notifications go with them through CASCADE)
    await run(
      'old finished entries',
      `DELETE FROM queue_entries
       WHERE status IN ('served', 'skipped', 'cancelled', 'no_show')
         AND completed_at < NOW() - INTERVAL ? DAY`,
      [RETENTION_DAYS]
    );
    // customers who no longer have any entry
    await run(
      'orphan customers',
      `DELETE c FROM customers c
       LEFT JOIN queue_entries e ON e.customer_id = c.id
       WHERE e.id IS NULL AND c.created_at < NOW() - INTERVAL 1 DAY`
    );
  });

  console.log('Cleanup jobs scheduled');
};