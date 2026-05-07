import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const orderItemInputSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1),
  notes: z.string().max(250).optional().or(z.literal('')),
});

export const createOrderSchema = z
  .object({
    orderType: z.enum(['DINE_IN', 'TAKEOUT']),
    customerName: z.string().max(100).optional().or(z.literal('')),
    tableNumber: z.string().max(20).optional().or(z.literal('')),
    notes: z.string().max(500).optional().or(z.literal('')),
    paymentMethod: z.string().default('cash'),
    receivedAmount: z.number().min(0),
    items: z.array(orderItemInputSchema).min(1, 'Add at least one item'),
  })
  .superRefine((data, ctx) => {
    if (data.orderType === 'DINE_IN' && !data.tableNumber) {
      ctx.addIssue({ code: 'custom', message: 'Table number is required for dine-in', path: ['tableNumber'] });
    }
    if (data.orderType === 'TAKEOUT' && !data.customerName) {
      ctx.addIssue({ code: 'custom', message: 'Customer name is required for takeout', path: ['customerName'] });
    }
  });

export const updateKitchenStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(['PENDING', 'PREPARING', 'READY', 'COMPLETED']),
});

export const categoryFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Category name is required').max(80),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/, 'Slug must use lowercase letters, numbers, and hyphens'),
  description: z.string().max(200).optional().or(z.literal('')),
  sortOrder: z.number().int().min(0),
  active: z.boolean(),
});

export const productFormSchema = z.object({
  id: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  name: z.string().min(2, 'Product name is required').max(120),
  slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/, 'Slug must use lowercase letters, numbers, and hyphens'),
  description: z.string().max(300).optional().or(z.literal('')),
  price: z.number().min(0),
  imageUrl: z.string().optional().or(z.literal('')),
  available: z.boolean(),
  active: z.boolean(),
});

export const userFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Name is required').max(120),
  username: z.string().min(3, 'Username is required').max(50).regex(/^[a-zA-Z0-9._-]+$/, 'Username can only contain letters, numbers, dot, underscore, and hyphen'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
  role: z.nativeEnum(UserRole),
  active: z.boolean(),
});
