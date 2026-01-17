/**
 * User Management Routes
 * Handles CRUD operations for users (ADMIN only)
 */

import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword, generateTempPassword } from '../services/hash.service';
import { createAuditLog, getClientIp } from '../services/audit.service';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/role';
import { createUserSchema, updateUserSchema, paginationSchema } from '../middleware/validation';
import { ZodError } from 'zod';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /users
 * Create a new user (ADMIN only)
 */
router.post('/', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate input
    const { email, password, role } = createUserSchema.parse(req.body);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({ error: 'Email already in use' });
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
      },
    });

    // Log the action
    await createAuditLog({
      actorUserId: req.user!.id,
      action: 'CREATE_USER',
      targetType: 'USER',
      targetId: user.id,
      ipAddress: getClientIp(req),
      metadata: { email: user.email, role: user.role },
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * GET /users
 * List all users (ADMIN only)
 */
router.get('/', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { assignments: true },
          },
        },
      }),
      prisma.user.count(),
    ]);

    res.json({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        assignedFilesCount: u._count.assignments,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

/**
 * GET /users/:id
 * Get single user details (ADMIN only)
 */
router.get('/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        assignments: {
          include: {
            file: {
              select: {
                id: true,
                originalName: true,
                projectSlug: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        assignedFiles: user.assignments.map((a) => a.file),
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

/**
 * PATCH /users/:id
 * Update user details (ADMIN only)
 */
router.patch('/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = updateUserSchema.parse(req.body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check email uniqueness if updating email
    if (updates.email && updates.email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: updates.email },
      });
      if (emailTaken) {
        res.status(409).json({ error: 'Email already in use' });
        return;
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: updates,
    });

    res.json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * PATCH /users/:id/reset-password
 * Reset user password and generate temporary password (ADMIN only)
 */
router.patch(
  '/:id/reset-password',
  authenticateToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Generate temporary password
      const tempPassword = generateTempPassword(16);

      // Hash and update password
      const passwordHash = await hashPassword(tempPassword);
      await prisma.user.update({
        where: { id },
        data: { passwordHash },
      });

      // Log the action
      await createAuditLog({
        actorUserId: req.user!.id,
        action: 'RESET_PASSWORD',
        targetType: 'USER',
        targetId: id,
        ipAddress: getClientIp(req),
        metadata: { targetEmail: existingUser.email },
      });

      // Return temp password (display once!)
      res.json({
        message: 'Password reset successfully',
        temporaryPassword: tempPassword,
        warning: 'This password will only be shown once. Please share it securely with the user.',
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  }
);

/**
 * DELETE /users/:id
 * Delete a user (ADMIN only)
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.user!.id) {
      res.status(400).json({ error: 'Cannot delete your own account' });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Delete user (assignments cascade delete)
    await prisma.user.delete({
      where: { id },
    });

    // Log the action
    await createAuditLog({
      actorUserId: req.user!.id,
      action: 'DELETE_USER',
      targetType: 'USER',
      targetId: id,
      ipAddress: getClientIp(req),
      metadata: { deletedEmail: existingUser.email },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
