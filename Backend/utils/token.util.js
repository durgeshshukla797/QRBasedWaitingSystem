import jwt from 'jsonwebtoken'

export const signToken = (merchantId) =>
  jwt.sign(
    { id: merchantId }, // payload --> kya kya data dena hai
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

export const verifyToken=(token)=> jwt.verify(token,process.env.JWT_SECRET);//it takes two parameter one is token encoded token and second one is secret key

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};