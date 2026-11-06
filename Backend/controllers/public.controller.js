import crypto from 'crypto';
import pool from "../db/db.js";
import { generateOtp, saveOtp, isOnCooldown, checkOtp, OTP_TTL_MIN } from '../utils/otp.utils.js';
import { HttpError } from '../utils/httpsError.util.js';
import { countAhead } from "../utils/queue.utils.js";
import { checkQueue, refreshQueue } from '../jobs/notifier.js';
import { sendOtpEmail } from '../utils/mail.util.js';


//UUID stands for Universally Unique Identifier. It is a 128-bit identifier commonly represented as a 36-character string.
//Example: 550e8400-e29b-41d4-a716-446655440000
//UUIDs are often used to identify users, records, sessions, or other resources

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/q/:slug  -> what the customer sees before joining
export const getQueueInfo = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `select q.id,q.name,q.status,q.avg_service_min,s.name as shopName
      from queues q
      JOIN shops s ON s.id=q.shop_id
      where q.slug=?
      `,
      [req.params.slug]
    );
    const queue = rows[0];
    if (!queue) return next(new HttpError(404, 'Queue not found'));

    const [count] = await pool.query(
      `select count(*) as waiting 
      from queue_entries
      where queue_id=? AND status IN ('waiting','notified','serving')
      `,
      [queue.id]
    );

    res.json({
      shopName: queue.shopName,
      queueName: queue.name,
      status: queue.status,
      peopleInQueue: count[0].waiting,
      estimatedWaitMin: Math.round(count[0].waiting * Number(queue.avg_service_min)),
    });

  } catch (error) {
    next(error)
  }
}

// POST /api/q/:slug/join
export const joinQueue = async (req, res, next) => {
  const { name, phone, email, otp } = req.body;

  let otpId;
  try {
    otpId = await checkOtp(email, otp);
  } catch (err) {
    return next(err);
  }
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // FOR UPDATE locks this queue row, so simultaneous joins are processed one by one
    const [qRows] = await conn.query(
      'SELECT id, name, status, last_token, avg_service_min FROM queues WHERE slug = ? FOR UPDATE',
      [req.params.slug]
    );

    const queue = qRows[0];//particular queue ko pahele hi store and lock kr diya
    if (!queue) throw new HttpError(404, 'Queue not found');
    if (queue.status !== 'open') throw new HttpError(409, `This queue is currently ${queue.status}`);

    // find or create the customer by email
    const [cRows] = await conn.query('SELECT id FROM customers where email=? LIMIT 1', [email]);
    let customerId;

    if (cRows[0]) {//agr customerId hai pahele se queue to just update their details like phone no and name
      customerId = cRows[0].id;
      await conn.query(
        `UPDATE customers SET name=? ,phone=?,email_verified = 1 where id=?`,
        [name, phone, customerId]
      );
    }
    else {//agr customer hai hi nahi queue me to add karo
      const [ins] = await conn.query(
        'INSERT into customers(name,phone,email,email_verified) VALUES(?,?,?,1)',
        [name, phone, email]
      );
      customerId = ins.insertId;
    }

    //one active entry per person per queue
    const [dup] = await conn.query(
      `select id from queue_entries
    where queue_id=? AND customer_id=? AND status IN('waiting','notified','serving')`,
      [queue.id, customerId]
    );

    if (dup[0]) throw new HttpError(409, 'You are already in this queue');

    //next token for this queue
    const tokenNo = queue.last_token + 1;
    await conn.query('UPDATE queues SET last_token = ? WHERE id = ?', [tokenNo, queue.id]);

    const entryKey = crypto.randomUUID();

    await conn.query(
      `insert into queue_entries 
    (queue_id,customer_id,entry_key,token_no) values(?,?,?,?)
    `,
      [queue.id, customerId, entryKey, tokenNo]
    );

    // the code has been used, so remove it
    await conn.query('DELETE FROM otps WHERE id = ?', [otpId]);

    const ahead = await countAhead(conn, queue.id, tokenNo);
    await conn.commit();

    res.status(201).json({
      entryKey,
      queueName: queue.name,
      token: tokenNo,
      position: ahead + 1,
      estimatedWaitMin: Math.round(ahead * Number(queue.avg_service_min)),
    });

  } catch (error) {
    await conn.rollback();//undo the changes made during a database transaction if something goes wrong
    next(error);
  }
  finally {
    conn.release();
  }
}

// GET /api/entry/:entryKey  -> the customer's live status page

export const getEntryStatus = async (req, res, next) => {
  try {
    const { entryKey } = req.params;

    //validate entryKey (optional, depends on your validation needs)
    if (!UUID_RE.test(entryKey)) throw new HttpError(404, 'Entry not found');

    const [rows] = await pool.query(
      `SELECT e.token_no, e.status, e.queue_id, c.name,
              q.name AS queueName, q.avg_service_min, s.name AS shopName
       FROM queue_entries e
       JOIN customers c ON c.id = e.customer_id
       JOIN queues q ON q.id = e.queue_id
       JOIN shops s ON s.id = q.shop_id
       WHERE e.entry_key = ?`,
      [entryKey]
    );

    const entry = rows[0];
    if (!entry) throw new HttpError(404, 'No Entry found');

    const isActive = ['waiting', 'notified', 'serving'].includes(entry.status);
    let position = null;
    let estimatedWaitMin = null;

    if (isActive) {
      const ahead = await countAhead(pool, entry.queue_id, entry.token_no);
      position = ahead + 1;
      estimatedWaitMin = Math.round(ahead * Number(entry.avg_service_min));
    }

    res.json({
      name: entry.name,
      shopName: entry.shopName,
      queueName: entry.queueName,
      token: entry.token_no,
      status: entry.status,
      position,
      estimatedWaitMin,
    });

  } catch (error) {
    next(error);
  }
}

// POST /api/entry/:entryKey/leave
export const leaveQueue = async (req, res, next) => {
  try {
    const { entryKey } = req.params;
    if (!UUID_RE.test(entryKey)) throw new HttpError(404, 'Entry not found');

    const [result] = await pool.query(
      `UPDATE queue_entries
       SET status = 'cancelled', completed_at = NOW()
       WHERE entry_key = ? AND status IN ('waiting', 'notified')`,
      [entryKey]
    );
    if (result.affectedRows === 0) {
      throw new HttpError(409, 'This entry can no longer be cancelled');
    }

    const [r] = await pool.query('SELECT queue_id FROM queue_entries WHERE entry_key = ?', [entryKey]);
    if (r[0]) refreshQueue(r[0].queue_id);



    res.json({ message: 'You have left the queue' });
  } catch (err) {
    next(err);
  }
};

// POST /api/q/:slug/otp
export const sendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    const [q] = await pool.query(
      `select id from queues where slug=? `,
      [req.params.slug]
    );

    if (!q[0]) throw new HttpError(404, 'Queue not found');

    if (await isOnCooldown(email)) {
      throw new HttpError(429, 'Please wait a minute before requesting another code');
    }

    const code = generateOtp();
    await saveOtp(email, code);

    console.log(`\n========================================`);
    console.log(`[DEV OTP] Verification code for ${email}: ${code}`);
    console.log(`========================================\n`);

    try {
      await sendOtpEmail(email, code);
    } catch (mailErr) {
      console.error('Email error:', mailErr?.message || mailErr);
      if (process.env.NODE_ENV === 'development') {
        return res.json({
          message: 'Verification code generated (check server console in dev mode)',
          expiresInMin: OTP_TTL_MIN,
          devCode: code,
        });
      }
      throw new HttpError(502, 'Could not send the email. Please try again');
    }

    res.json({ message: 'Verification code sent', expiresInMin: OTP_TTL_MIN });
  } catch (error) {
    next(error);
  }
};

// GET /api/shops?search=&type=&limit=&offset=
export const listPublicShops = async (req, res, next) => {
  try {
    let { search, type, limit = 20, offset = 0 } = req.query;

    limit = parseInt(limit, 10);
    if (isNaN(limit) || limit < 1) limit = 20;
    if (limit > 50) limit = 50;

    offset = parseInt(offset, 10);
    if (isNaN(offset) || offset < 0) offset = 0;

    const whereClauses = ['s.is_public = 1'];
    const params = [];

    if (search && search.trim()) {
      whereClauses.push('(s.name LIKE ? OR s.address LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    if (type && ['shop', 'clinic'].includes(type.trim().toLowerCase())) {
      whereClauses.push('s.type = ?');
      params.push(type.trim().toLowerCase());
    }

    const fetchLimit = limit + 1;
    const sql = `
      SELECT 
        s.id, 
        s.name, 
        s.address, 
        s.type, 
        COUNT(q.id) AS queueCount
      FROM shops s
      JOIN queues q ON q.shop_id = s.id AND q.status IN ('open', 'paused')
      WHERE ${whereClauses.join(' AND ')}
      GROUP BY s.id, s.name, s.address, s.type
      HAVING queueCount > 0
      ORDER BY s.id DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(sql, [...params, fetchLimit, offset]);

    const hasMore = rows.length > limit;
    const shops = rows.slice(0, limit).map((r) => ({
      id: r.id,
      name: r.name,
      address: r.address,
      type: r.type,
      queueCount: Number(r.queueCount),
    }));

    res.json({ shops, hasMore });
  } catch (error) {
    next(error);
  }
};

// GET /api/shops/:shopId
export const getPublicShop = async (req, res, next) => {
  try {
    const shopId = parseInt(req.params.shopId, 10);
    if (isNaN(shopId) || shopId <= 0) {
      throw new HttpError(404, 'Shop not found');
    }

    const [shopRows] = await pool.query(
      'SELECT id, name, address, type, is_public FROM shops WHERE id = ?',
      [shopId]
    );

    const shop = shopRows[0];
    if (!shop || !shop.is_public) {
      throw new HttpError(404, 'Shop not found');
    }

    const [queueRows] = await pool.query(
      `SELECT 
        q.id,
        q.name,
        q.slug,
        q.status,
        q.avg_service_min,
        COUNT(CASE WHEN qe.status IN ('waiting', 'notified', 'serving') THEN 1 END) AS peopleInQueue
      FROM queues q
      LEFT JOIN queue_entries qe ON qe.queue_id = q.id
      WHERE q.shop_id = ? AND q.status IN ('open', 'paused')
      GROUP BY q.id, q.name, q.slug, q.status, q.avg_service_min
      ORDER BY q.id ASC`,
      [shopId]
    );

    const queues = queueRows.map((q) => {
      const people = Number(q.peopleInQueue || 0);
      const estMin = Math.round(people * Number(q.avg_service_min || 0));
      return {
        name: q.name,
        slug: q.slug,
        status: q.status,
        peopleInQueue: people,
        estimatedWaitMin: estMin,
      };
    });

    res.json({
      id: shop.id,
      name: shop.name,
      address: shop.address,
      type: shop.type,
      queues,
    });
  } catch (error) {
    next(error);
  }
};