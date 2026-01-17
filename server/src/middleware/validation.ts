/**
 * Zod Validation Schemas
 * Input validation for all API endpoints
 */

import { z } from 'zod';

// ===================
// Auth Schemas
// ===================

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// ===================
// User Schemas
// ===================

export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase, one uppercase, and one number'
    ),
  role: z.enum(['ADMIN', 'USER']).default('USER'),
});

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  role: z.enum(['ADMIN', 'USER']).optional(),
});

// ===================
// File Schemas
// ===================

export const uploadFileSchema = z.object({
  projectSlug: z
    .string()
    .min(1, 'Project slug is required')
    .max(50, 'Project slug too long')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Project slug can only contain letters, numbers, hyphens, and underscores'
    ),
});

// ===================
// Assignment Schemas
// ===================

export const createAssignmentSchema = z.object({
  fileId: z.string().uuid('Invalid file ID'),
  userId: z.string().uuid('Invalid user ID'),
});

export const bulkAssignmentSchema = z.object({
  fileId: z.string().uuid('Invalid file ID'),
  userIds: z.array(z.string().uuid('Invalid user ID')).min(1, 'At least one user required'),
});

// ===================
// Pagination Schemas
// ===================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ===================
// Type Exports
// ===================

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UploadFileInput = z.infer<typeof uploadFileSchema>;
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type BulkAssignmentInput = z.infer<typeof bulkAssignmentSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
