import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;//This controls how much computational work bcrypt performs

export const hashPassword = (plain) => bcrypt.hash(plain, SALT_ROUNDS);

export const comparePassword = (plain, hash) => bcrypt.compare(plain, hash);
//plain — the password the user just entered.
// hash — the stored password hash fetched from your database.