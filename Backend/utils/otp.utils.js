import crypto from 'crypto'
import pool from "../db/db.js";
import { HttpError } from './httpsError.util.js';

export const OTP_TTL_MIN=5;//an OTP is valid for 5 minutes.
const MAX_ATTEMPTS=5;//a user can make up to 5 incorrect attempts before being blocked from further attempts with that OTP

export const generateOtp=()=> String(crypto.randomInt(0,1000000)).padStart(6,'0');

// HMAC with a server secret, so a leaked database doesn't reveal codes
const hashOtp = (email, code) =>
  crypto.createHmac('sha256', process.env.OTP_SECRET).update(`${email}:${code}`).digest('hex');

export const saveOtp = async (email, code) => {
  await pool.query('DELETE FROM otps WHERE email = ?', [email]);
  await pool.query(
    'INSERT INTO otps (email, code_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))',
    [email, hashOtp(email, code), OTP_TTL_MIN]
  );
};

// This function checks whether the user requested an OTP within approximately the last minute
export const isOnCooldown = async (email) => {
  const [rows] = await pool.query(
    'SELECT id FROM otps WHERE email = ? AND expires_at > DATE_ADD(NOW(), INTERVAL ? MINUTE)',
    [email, OTP_TTL_MIN - 1]
  );
  return rows.length > 0;
  //true: a matching OTP record exists, so the user is on cooldown.
  //false: no matching record exists, so the user is not on cooldown.
};

// returns the otp row id if the code is right, otherwise throws
export const checkOtp = async (email, code) => {
  const [rows] = await pool.query(
    'SELECT id, code_hash, attempts FROM otps WHERE email = ? AND expires_at > NOW()',
    [email]
  );
  const row = rows[0];

  if (!row) throw new HttpError(400, 'Code expired or not requested. Please request a new one');
  if (row.attempts >= MAX_ATTEMPTS) {
    throw new HttpError(429, 'Too many wrong attempts. Please request a new code');
  }

  const expected = Buffer.from(row.code_hash, 'hex');
  const given = Buffer.from(hashOtp(email, code), 'hex');

  if (!crypto.timingSafeEqual(expected, given)) {
    await pool.query('UPDATE otps SET attempts = attempts + 1 WHERE id = ?', [row.id]);
    throw new HttpError(400, 'Incorrect code');
  }
  return row.id;
};