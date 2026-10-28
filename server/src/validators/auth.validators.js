import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required.' })
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(80, 'Name must be at most 80 characters.'),
  email: z
    .string({ required_error: 'Email is required.' })
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address.')
    .max(160),
  password: z
    .string({ required_error: 'Password is required.' })
    .min(8, 'Password must be at least 8 characters.')
    .max(72, 'Password must be at most 72 characters.')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter.')
    .regex(/\d/, 'Password must contain at least one number.'),
  phone: z.string().trim().max(20).optional().default(''),
  // `role` is intentionally NOT accepted: public registration always creates
  // citizens. Administrator accounts are provisioned by the seed script only.
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address.'),
  password: z.string({ required_error: 'Password is required.' }).min(1, 'Password is required.'),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().max(20).optional(),
  avatarUrl: z.string().trim().url('Avatar must be a valid URL.').or(z.literal('')).optional(),
  department: z.string().trim().max(120).optional(),
});

export default { registerSchema, loginSchema, updateProfileSchema };
