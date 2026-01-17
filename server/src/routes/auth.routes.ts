/**
 * Authentication Routes
 * Handles login, token refresh, and user info
 */

import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyPassword } from '../services/hash.service';
import { createAuditLog, getClientIp } from '../services/audit.service';
import { authenticateToken, generateToken, AuthenticatedRequest } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';
import { loginSchema } from '../middleware/validation';
import { ZodError } from 'zod';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', authLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate input
    const { email, password } = loginSchema.parse(req.body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Log successful login
    await createAuditLog({
      actorUserId: user.id,
      action: 'LOGIN',
      targetType: 'USER',
      targetId: user.id,
      ipAddress: getClientIp(req),
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /auth/me
 * Get current authenticated user info
 */
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /auth/refresh
 * Refresh JWT token (optional endpoint)
 */
router.post('/refresh', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Generate new token
    const token = generateToken(req.user);

    res.json({ token });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
