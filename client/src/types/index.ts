/**
 * TypeScript Types for J-Innov Frontend
 */

export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
  assignedFilesCount?: number;
}

export interface File {
  id: string;
  originalName: string;
  projectSlug: string;
  sizeBytes: number;
  sha256: string;
  uploadedAt: string;
  assignedUsers?: { id: string; email: string }[];
}

export interface Assignment {
  id: string;
  userId: string;
  fileId: string;
  createdAt: string;
  user?: User;
  file?: File;
}

export interface AuditLog {
  id: string;
  actorUserId: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  ipAddress: string | null;
  metadata: string | null;
  createdAt: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ApiError {
  error: string;
  details?: unknown;
}
