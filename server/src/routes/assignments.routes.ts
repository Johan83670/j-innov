/**
 * Assignment Routes
 * Handles file-to-user assignment operations
 */

import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createAuditLog, getClientIp } from '../services/audit.service';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/role';
import { createAssignmentSchema, bulkAssignmentSchema } from '../middleware/validation';
import { ZodError } from 'zod';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /assignments
 * Assign a file to a user (ADMIN only)
 */
router.post('/', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate input
    const { fileId, userId } = createAssignmentSchema.parse(req.body);

    // Verify file exists
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.assignment.findUnique({
      where: {
        userId_fileId: { userId, fileId },
      },
    });

    if (existingAssignment) {
      res.status(409).json({ error: 'File already assigned to this user' });
      return;
    }

    // Create assignment
    const assignment = await prisma.assignment.create({
      data: { userId, fileId },
      include: {
        user: { select: { id: true, email: true } },
        file: { select: { id: true, originalName: true } },
      },
    });

    // Log the action
    await createAuditLog({
      actorUserId: req.user!.id,
      action: 'ASSIGN_FILE',
      targetType: 'ASSIGNMENT',
      targetId: assignment.id,
      ipAddress: getClientIp(req),
      metadata: {
        fileId,
        userId,
        fileName: file.originalName,
        userEmail: user.email,
      },
    });

    res.status(201).json({
      message: 'File assigned successfully',
      assignment: {
        id: assignment.id,
        user: assignment.user,
        file: assignment.file,
        createdAt: assignment.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Create assignment error:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

/**
 * POST /assignments/bulk
 * Assign a file to multiple users at once (ADMIN only)
 */
router.post('/bulk', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate input
    const { fileId, userIds } = bulkAssignmentSchema.parse(req.body);

    // Verify file exists
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    // Verify all users exist
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
    });

    if (users.length !== userIds.length) {
      res.status(404).json({ error: 'One or more users not found' });
      return;
    }

    // Get existing assignments
    const existingAssignments = await prisma.assignment.findMany({
      where: {
        fileId,
        userId: { in: userIds },
      },
    });

    const existingUserIds = new Set(existingAssignments.map((a) => a.userId));
    const newUserIds = userIds.filter((id) => !existingUserIds.has(id));

    // Create new assignments (only for users not already assigned)
    const createdCount = await prisma.assignment.createMany({
      data: newUserIds.map((userId) => ({ userId, fileId })),
    });

    // Log the action
    await createAuditLog({
      actorUserId: req.user!.id,
      action: 'ASSIGN_FILE',
      targetType: 'FILE',
      targetId: fileId,
      ipAddress: getClientIp(req),
      metadata: {
        fileId,
        userIds: newUserIds,
        fileName: file.originalName,
        assignedCount: createdCount.count,
        skippedCount: existingUserIds.size,
      },
    });

    res.status(201).json({
      message: 'Files assigned successfully',
      created: createdCount.count,
      skipped: existingUserIds.size,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Bulk assignment error:', error);
    res.status(500).json({ error: 'Failed to create assignments' });
  }
});

/**
 * DELETE /assignments/:id
 * Remove a file assignment (ADMIN only)
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        user: { select: { email: true } },
        file: { select: { originalName: true } },
      },
    });

    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    await prisma.assignment.delete({
      where: { id },
    });

    // Log the action
    await createAuditLog({
      actorUserId: req.user!.id,
      action: 'UNASSIGN_FILE',
      targetType: 'ASSIGNMENT',
      targetId: id,
      ipAddress: getClientIp(req),
      metadata: {
        fileId: assignment.fileId,
        userId: assignment.userId,
        fileName: assignment.file.originalName,
        userEmail: assignment.user.email,
      },
    });

    res.json({ message: 'Assignment removed successfully' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

/**
 * DELETE /assignments/file/:fileId/user/:userId
 * Remove assignment by file and user IDs (ADMIN only)
 */
router.delete(
  '/file/:fileId/user/:userId',
  authenticateToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { fileId, userId } = req.params;

      const assignment = await prisma.assignment.findUnique({
        where: {
          userId_fileId: { userId, fileId },
        },
        include: {
          user: { select: { email: true } },
          file: { select: { originalName: true } },
        },
      });

      if (!assignment) {
        res.status(404).json({ error: 'Assignment not found' });
        return;
      }

      await prisma.assignment.delete({
        where: { id: assignment.id },
      });

      // Log the action
      await createAuditLog({
        actorUserId: req.user!.id,
        action: 'UNASSIGN_FILE',
        targetType: 'ASSIGNMENT',
        targetId: assignment.id,
        ipAddress: getClientIp(req),
        metadata: {
          fileId,
          userId,
          fileName: assignment.file.originalName,
          userEmail: assignment.user.email,
        },
      });

      res.json({ message: 'Assignment removed successfully' });
    } catch (error) {
      console.error('Delete assignment error:', error);
      res.status(500).json({ error: 'Failed to delete assignment' });
    }
  }
);

/**
 * GET /assignments/file/:fileId
 * Get all users assigned to a file (ADMIN only)
 */
router.get('/file/:fileId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fileId } = req.params;

    const assignments = await prisma.assignment.findMany({
      where: { fileId },
      include: {
        user: {
          select: { id: true, email: true, role: true },
        },
      },
    });

    res.json({
      fileId,
      assignedUsers: assignments.map((a) => ({
        assignmentId: a.id,
        user: a.user,
        assignedAt: a.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get file assignments error:', error);
    res.status(500).json({ error: 'Failed to get assignments' });
  }
});

export default router;
