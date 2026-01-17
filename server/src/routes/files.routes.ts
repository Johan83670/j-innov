/**
 * File Management Routes
 * Handles file upload, listing, and download
 */

import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import {
  generateS3Key,
  calculateSha256,
  uploadZipToS3,
  getPresignedDownloadUrl,
  getFileStream,
} from '../services/s3.service';
import { createAuditLog, getClientIp } from '../services/audit.service';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { requireAdmin, requireUser } from '../middleware/role';
import { uploadLimiter, downloadLimiter } from '../middleware/rateLimit';
import { uploadFileSchema, paginationSchema } from '../middleware/validation';
import { ZodError } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const MAX_UPLOAD_MB = parseInt(process.env.MAX_UPLOAD_MB || '100', 10);
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: MAX_UPLOAD_MB * 1024 * 1024, // Convert MB to bytes
  },
  fileFilter: (req, file, cb) => {
    // Only accept .zip files
    if (
      file.mimetype === 'application/zip' ||
      file.mimetype === 'application/x-zip-compressed' ||
      file.originalname.toLowerCase().endsWith('.zip')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only .zip files are allowed'));
    }
  },
});

// Download mode from environment
const DOWNLOAD_MODE = process.env.DOWNLOAD_MODE || 'presigned';

/**
 * POST /files/upload
 * Upload a ZIP file (ADMIN only)
 */
router.post(
  '/upload',
  authenticateToken,
  requireAdmin,
  uploadLimiter,
  upload.single('file'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      // Validate project slug
      const { projectSlug } = uploadFileSchema.parse(req.body);

      // Calculate SHA256 checksum
      const sha256 = calculateSha256(req.file.buffer);

      // Generate S3 key
      const s3Key = generateS3Key(projectSlug, req.file.originalname);

      // Upload to S3
      await uploadZipToS3(req.file.buffer, s3Key, sha256);

      // Save to database
      const file = await prisma.file.create({
        data: {
          originalName: req.file.originalname,
          projectSlug,
          s3Key,
          sizeBytes: req.file.size,
          sha256,
        },
      });

      // Log the upload
      await createAuditLog({
        actorUserId: req.user!.id,
        action: 'UPLOAD',
        targetType: 'FILE',
        targetId: file.id,
        ipAddress: getClientIp(req),
        metadata: {
          originalName: file.originalName,
          projectSlug,
          sizeBytes: file.sizeBytes,
        },
      });

      res.status(201).json({
        message: 'File uploaded successfully',
        file: {
          id: file.id,
          originalName: file.originalName,
          projectSlug: file.projectSlug,
          sizeBytes: file.sizeBytes,
          sha256: file.sha256,
          uploadedAt: file.uploadedAt,
        },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({
            error: `File too large. Maximum size is ${MAX_UPLOAD_MB}MB`,
          });
          return;
        }
        res.status(400).json({ error: error.message });
        return;
      }
      if (error instanceof Error && error.message === 'Only .zip files are allowed') {
        res.status(400).json({ error: error.message });
        return;
      }
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  }
);

/**
 * GET /files
 * List files (ADMIN sees all, USER sees only assigned files)
 */
router.get('/', authenticateToken, requireUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const skip = (page - 1) * limit;

    let files;
    let total;

    if (req.user!.role === 'ADMIN') {
      // Admin sees all files
      [files, total] = await Promise.all([
        prisma.file.findMany({
          skip,
          take: limit,
          orderBy: { uploadedAt: 'desc' },
          include: {
            assignments: {
              include: {
                user: {
                  select: { id: true, email: true },
                },
              },
            },
          },
        }),
        prisma.file.count(),
      ]);
    } else {
      // User sees only assigned files
      [files, total] = await Promise.all([
        prisma.file.findMany({
          where: {
            assignments: {
              some: { userId: req.user!.id },
            },
          },
          skip,
          take: limit,
          orderBy: { uploadedAt: 'desc' },
        }),
        prisma.file.count({
          where: {
            assignments: {
              some: { userId: req.user!.id },
            },
          },
        }),
      ]);
    }

    // Type for file with optional assignments
    type FileWithAssignments = typeof files[number] & {
      assignments?: Array<{ user: { id: string; email: string } }>;
    };

    res.json({
      files: files.map((f: FileWithAssignments) => ({
        id: f.id,
        originalName: f.originalName,
        projectSlug: f.projectSlug,
        sizeBytes: f.sizeBytes,
        sha256: f.sha256,
        uploadedAt: f.uploadedAt,
        assignedUsers: f.assignments?.map((a) => a.user),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

/**
 * GET /files/:id
 * Get single file details
 */
router.get('/:id', authenticateToken, requireUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const file = await prisma.file.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            user: {
              select: { id: true, email: true },
            },
          },
        },
      },
    });

    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    // Check access for non-admin users
    if (req.user!.role !== 'ADMIN') {
      const hasAccess = file.assignments.some((a) => a.userId === req.user!.id);
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }
    }

    res.json({
      file: {
        id: file.id,
        originalName: file.originalName,
        projectSlug: file.projectSlug,
        sizeBytes: file.sizeBytes,
        sha256: file.sha256,
        uploadedAt: file.uploadedAt,
        assignedUsers: file.assignments.map((a) => a.user),
      },
    });
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ error: 'Failed to get file' });
  }
});

/**
 * GET /files/:id/download
 * Download a file (presigned URL redirect or proxy stream)
 */
router.get(
  '/:id/download',
  authenticateToken,
  requireUser,
  downloadLimiter,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Get file from database
      const file = await prisma.file.findUnique({
        where: { id },
        include: {
          assignments: true,
        },
      });

      if (!file) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      // Check access for non-admin users
      if (req.user!.role !== 'ADMIN') {
        const hasAccess = file.assignments.some((a) => a.userId === req.user!.id);
        if (!hasAccess) {
          res.status(403).json({ error: 'Access denied to this file' });
          return;
        }
      }

      // Log download action
      await createAuditLog({
        actorUserId: req.user!.id,
        action: 'DOWNLOAD',
        targetType: 'FILE',
        targetId: file.id,
        ipAddress: getClientIp(req),
        metadata: {
          originalName: file.originalName,
          mode: DOWNLOAD_MODE,
        },
      });

      if (DOWNLOAD_MODE === 'presigned') {
        // Generate presigned URL and redirect
        const url = await getPresignedDownloadUrl(file.s3Key);
        res.redirect(url);
      } else {
        // Proxy stream the file
        const { stream, contentLength } = await getFileStream(file.s3Key);

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${encodeURIComponent(file.originalName)}"`
        );
        if (contentLength) {
          res.setHeader('Content-Length', contentLength);
        }

        stream.pipe(res);
      }
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ error: 'Failed to download file' });
    }
  }
);

/**
 * DELETE /files/:id
 * Delete a file (ADMIN only)
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const file = await prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    // Delete from database (assignments cascade delete)
    await prisma.file.delete({
      where: { id },
    });

    // Note: We're not deleting from S3 here for safety
    // Implement S3 deletion if needed

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;
