import {z} from 'zod';

const indianMobile= z
  .string()
  .trim()
  .transform((v)=>v.replace(/[\s-]/g, '').replace(/^(\+91|91|0)(?=\d{10}$)/, ''))
  .refine((v) => /^[6-9]\d{9}$/.test(v), 'Enter a valid 10-digit mobile number');

export const sendOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(255),
});

export const joinQueueSchema=z.object({
   name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
   phone: indianMobile,
   email: z.string().trim().toLowerCase().email('Enter a valid email address').max(255),
    otp: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code'),
});
//The transform cleans +91 98765-43210 into 9876543210 before checking it.
