import {z} from 'zod';

export const createShopSchema=z.object({
  name:z.string().trim().min(2, 'Shop name must be at least 2 characters').max(150),
  address:z.string().trim().max(255).optional(),
  type:z.enum(['shop', 'clinic']).default('shop'),
  isPublic: z.boolean().optional().default(true),
})

export const updateShopSchema = z
  .object({
    name: z.string().trim().min(2).max(150).optional(),
    address: z.string().trim().max(255).nullable().optional(),
    type: z.enum(['shop', 'clinic']).optional(),
    isPublic: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, 'Provide at least one field to update');