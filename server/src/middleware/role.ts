/**
 * Role-based Access Control Middleware
 * Restricts routes based on user roles
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

export type UserRole = 'ADMIN' | 'USER';

/**
 * Middleware factory to require specific roles
 * @param allowedRoles - Array of roles that can access the route
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      res.status(403).json({
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role,
      });
      return;
    }

    next();
  };
}

/**
 * Shorthand for admin-only routes
 */
export const requireAdmin = requireRole('ADMIN');

/**
 * Shorthand for any authenticated user
 */
export const requireUser = requireRole('ADMIN', 'USER');
