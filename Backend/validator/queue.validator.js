import { z } from 'zod';

export const createQueueSchema = z.object({
  name: z.string().trim().min(2, 'Queue name must be at least 2 characters').max(100),
  avgServiceMin: z.number().min(1).max(120).default(5),
});

export const queueStatusSchema=z.object({
  status:z.enum(['open','paused','closed'])
});

export const updateQueueSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    avgServiceMin: z.number().min(1).max(120).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, 'Provide at least one field to update');