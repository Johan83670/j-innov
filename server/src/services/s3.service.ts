/**
 * S3 Service for IONOS Object Storage
 * Handles file uploads, presigned URLs, and proxy streaming
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import crypto from 'crypto';

// S3 Client Configuration for IONOS
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT || 'https://s3.eu-central-1.ionoscloud.com',
  region: process.env.S3_REGION || 'eu-central-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
});

const BUCKET = process.env.S3_BUCKET || 'j-innov-files';
const SIGNED_URL_EXPIRES = parseInt(
  process.env.SIGNED_URL_EXPIRES_SECONDS || '3600',
  10
);

/**
 * Generate S3 object key based on project, date, and filename
 * Format: /projects/{projectSlug}/{yyyy-mm-dd}/{originalFileName}
 */
export function generateS3Key(
  projectSlug: string,
  originalFileName: string
): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0]; // yyyy-mm-dd
  
  // Sanitize inputs to prevent path traversal
  const safeProjectSlug = sanitizePathComponent(projectSlug);
  const safeFileName = sanitizeFileName(originalFileName);
  
  return `projects/${safeProjectSlug}/${dateStr}/${safeFileName}`;
}

/**
 * Sanitize path component to prevent directory traversal
 */
function sanitizePathComponent(input: string): string {
  return input
    .replace(/\.\./g, '') // Remove ..
    .replace(/[\/\\]/g, '-') // Replace slashes
    .replace(/[^a-zA-Z0-9_-]/g, '_') // Keep only safe characters
    .slice(0, 50); // Limit length
}

/**
 * Sanitize filename while preserving extension
 */
function sanitizeFileName(fileName: string): string {
  const ext = fileName.split('.').pop() || '';
  const name = fileName.replace(/\.[^/.]+$/, '');
  
  const safeName = name
    .replace(/\.\./g, '')
    .replace(/[\/\\]/g, '-')
    .replace(/[^a-zA-Z0-9_.-]/g, '_')
    .slice(0, 100);
  
  return ext ? `${safeName}.${ext}` : safeName;
}

/**
 * Calculate SHA256 checksum of a buffer
 */
export function calculateSha256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Upload a ZIP file to S3
 */
export async function uploadZipToS3(
  buffer: Buffer,
  s3Key: string,
  sha256: string
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: s3Key,
    Body: buffer,
    ContentType: 'application/zip',
    Metadata: {
      'checksum-sha256': sha256,
    },
  });

  await s3Client.send(command);
}

/**
 * Generate a presigned URL for downloading a file
 */
export async function getPresignedDownloadUrl(s3Key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: s3Key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: SIGNED_URL_EXPIRES });
}

/**
 * Get file stream for proxy download
 */
export async function getFileStream(
  s3Key: string
): Promise<{ stream: Readable; contentLength?: number }> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: s3Key,
  });

  const response = await s3Client.send(command);
  
  if (!response.Body) {
    throw new Error('No body in S3 response');
  }

  return {
    stream: response.Body as Readable,
    contentLength: response.ContentLength,
  };
}

/**
 * Delete a file from S3
 */
export async function deleteFileFromS3(s3Key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: s3Key,
  });

  await s3Client.send(command);
}

export { s3Client, BUCKET };
