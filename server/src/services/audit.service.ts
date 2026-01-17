/**
 * Audit Service
 * Centralized logging for all user actions
 */

import { PrismaClient } from '@prisma/client';
import { Request } from 'express';

const prisma = new PrismaClient();

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'UPLOAD'
  | 'DOWNLOAD'
  | 'CREATE_USER'
  | 'DELETE_USER'
  | 'RESET_PASSWORD'
  | 'ASSIGN_FILE'
  | 'UNASSIGN_FILE'
  | 'SEED_ADMIN';

export type TargetType = 'USER' | 'FILE' | 'ASSIGNMENT' | null;

interface AuditLogParams {
  actorUserId: string | null;
  action: AuditAction;
  targetType?: TargetType;
  targetId?: string | null;
  ipAddress?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: params.actorUserId,
        action: params.action,
        targetType: params.targetType || null,
        targetId: params.targetId || null,
        ipAddress: params.ipAddress || null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  } catch (error) {
    // Log error but don't throw - audit logging should not break main flow
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Get client IP address from request
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ip.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || 'unknown';
}
