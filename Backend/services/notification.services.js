import pool from "../db/db.js";
import { sendMail } from "../utils/mail.util.js";

const MAX_RETRIES = 3;

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const loadEntry = async (entryId) => {
  const [rows] = await pool.query(
    `SELECT e.id, e.token_no, e.entry_key, c.name, c.email,
            q.name AS queueName, s.name AS shopName
     FROM queue_entries e
     JOIN customers c ON c.id = e.customer_id
     JOIN queues q ON q.id = e.queue_id
     JOIN shops s ON s.id = q.shop_id
     WHERE e.id = ?`,
    [entryId]
  );
  return rows[0];
};

const logAttempt = (entryId, type, status, error = null) =>
  pool.query(
    `INSERT INTO notifications (entry_id, channel, type, status, error, sent_at)
     VALUES (?, 'email', ?, ?, ?, ${status === 'sent' ? 'NOW()' : 'NULL'})`,
    [entryId, type, status, error ? String(error).slice(0, 255) : null]
  );

const statusLink = (entry) => `${process.env.APP_URL}/status/${entry.entry_key}`;

export const notifyUpcoming = async (entryId, { etaMin }) => {
  // Atomic claim: only ONE run can flip waiting -> notified for this entry,
  // so there are never duplicate emails, even if two checks overlap.
  const [claim] = await pool.query(
    `UPDATE queue_entries
     SET status = 'notified', notified_at = NOW()
     WHERE id = ? AND status = 'waiting' AND notified_at IS NULL`,
    [entryId]
  );
  if (claim.affectedRows === 0) return false;

  const entry = await loadEntry(entryId);
  if (!entry) return false;

  const when = etaMin <= 1 ? 'very soon' : `in about ${etaMin} minutes`;

  try {
    
    await sendMail({
      to: entry.email,
      subject: `Your turn is coming up at ${entry.shopName}`,
      text:
        `Hi ${entry.name},\n\nYour turn at ${entry.shopName} (${entry.queueName}) is ${when}.\n` +
        `Your token number is ${entry.token_no}. Please head to the counter now.\n\n` +
        `Track your place: ${statusLink(entry)}`,
      html:
        `<p>Hi ${escapeHtml(entry.name)},</p>` +
        `<p>Your turn at <b>${escapeHtml(entry.shopName)}</b> (${escapeHtml(entry.queueName)}) is <b>${when}</b>.</p>` +
        `<p>Your token number is <b>${entry.token_no}</b>. Please head to the counter now.</p>` +
        `<p><a href="${statusLink(entry)}">Track your place</a></p>`,
    });
    await logAttempt(entryId, 'upcoming', 'sent');

  } catch (err) {
    
    console.error('Upcoming email failed:', err.message);
    await logAttempt(entryId, 'upcoming', 'failed', err.message);

    // release the claim so the next check retries, up to MAX_RETRIES times
    const [failed] = await pool.query(
      `SELECT COUNT(*) AS c FROM notifications
       WHERE entry_id = ? AND type = 'upcoming' AND status = 'failed'`,
      [entryId]
    );
    if (failed[0].c < MAX_RETRIES) {
      await pool.query(
        `UPDATE queue_entries SET status = 'waiting', notified_at = NULL
         WHERE id = ? AND status = 'notified'`,
        [entryId]
      );
    }

  }
  return true; 
};

export const notifyYourTurn = async (entryId) => {
  const entry = await loadEntry(entryId);
  if (!entry) return;

  try {
    await sendMail({
      to: entry.email,
      subject: `It's your turn at ${entry.shopName}`,
      text:
        `Hi ${entry.name},\n\nIt's your turn now at ${entry.shopName} (${entry.queueName}).\n` +
        `Token number: ${entry.token_no}. Please come to the counter.`,
      html:
        `<p>Hi ${escapeHtml(entry.name)},</p>` +
        `<p>It's <b>your turn now</b> at <b>${escapeHtml(entry.shopName)}</b> (${escapeHtml(entry.queueName)}).</p>` +
        `<p>Token number: <b>${entry.token_no}</b>. Please come to the counter.</p>`,
    });
    await logAttempt(entryId, 'your_turn', 'sent');
  } catch (err) {
    console.error('Your-turn email failed:', err.message);
    await logAttempt(entryId, 'your_turn', 'failed', err.message);
  }
};