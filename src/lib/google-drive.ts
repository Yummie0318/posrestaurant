import { existsSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { GaxiosError } from 'gaxios';
import { google } from 'googleapis';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_RETRIES = 4;
const BASE_DELAY_MS = 700;
const MAX_DELAY_MS = 6000;

function getDriveConfig() {
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!keyPath) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY_PATH is not configured');
  if (!folderId) throw new Error('GOOGLE_DRIVE_FOLDER_ID is not configured');
  if (!existsSync(keyPath)) throw new Error(`Google service account key file not found at: ${keyPath}`);
  return { keyPath, folderId };
}

async function getDriveClient() {
  const { keyPath } = getDriveConfig();
  const auth = new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  return google.drive({ version: 'v3', auth });
}

function getSafeExtension(mimeType: string) {
  if (mimeType === 'image/jpeg') return '.jpg';
  if (mimeType === 'image/png') return '.png';
  if (mimeType === 'image/webp') return '.webp';
  return '';
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorMessage(error: GaxiosError) {
  return error.response?.data && typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : error.message;
}

function isRetryableRateLimit(error: unknown) {
  if (!(error instanceof GaxiosError)) return false;
  const message = getErrorMessage(error);
  return error.status === 429 || message.includes('User rate limit exceeded') || message.includes('rateLimitExceeded') || message.includes('userRateLimitExceeded') || message.includes('Too Many Requests');
}

async function withDriveRetry<T>(operation: () => Promise<T>) {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isRetryableRateLimit(error) || attempt === MAX_RETRIES) break;
      const expDelay = Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS);
      const jitter = Math.floor(Math.random() * 350);
      await sleep(expDelay + jitter);
    }
  }
  throw lastError;
}

function normalizeDriveError(error: unknown): Error {
  if (error instanceof GaxiosError) {
    const message = getErrorMessage(error);
    const quotaHint = 'Service Accounts do not have storage quota';
    if (message.includes(quotaHint)) {
      return new Error('Google Drive rejected the upload because the configured folder is in regular My Drive. Move the target folder into a Shared Drive, or switch to delegated/OAuth user upload. Service-account access as Editor on a normal folder is not enough.');
    }
    if (message.includes('User rate limit exceeded') || message.includes('rateLimitExceeded') || error.status === 429) {
      return new Error('Image upload reached Google Drive successfully, but Google is temporarily rate-limiting uploads right now. Please wait a moment and try again.');
    }
  }
  if (error instanceof Error) return error;
  return new Error('Google Drive request failed.');
}

export function isDriveBackedImage(value?: string | null) {
  return typeof value === 'string' && /^\/api\/drive-files\/[a-zA-Z0-9_-]+$/.test(value);
}

export function extractDriveFileId(value?: string | null) {
  if (!isDriveBackedImage(value)) return null;
  return value!.split('/').pop() ?? null;
}

export async function uploadProductImage(file: File, slugHint: string) {
  const { folderId } = getDriveConfig();
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) throw new Error('Unsupported image type. Please upload jpg, png, or webp.');
  if (file.size > MAX_IMAGE_SIZE_BYTES) throw new Error('Image must be 5MB or smaller.');

  const extension = getSafeExtension(file.type);
  const safeSlug = slugHint.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'product';
  const fileName = `${safeSlug}-${randomUUID()}${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const drive = await getDriveClient();

  try {
    const response = await withDriveRetry(() => drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId],
      },
      media: {
        mimeType: file.type,
        body: Readable.from(buffer),
      },
      fields: 'id',
      supportsAllDrives: true,
    }));

    const fileId = response.data.id;
    if (!fileId) throw new Error('Google Drive upload succeeded but no file id was returned.');

    return {
      fileId,
      imageUrl: `/api/drive-files/${fileId}`,
      originalName: file.name,
    };
  } catch (error) {
    throw normalizeDriveError(error);
  }
}

export async function deleteDriveFile(fileId: string) {
  const drive = await getDriveClient();
  try {
    await withDriveRetry(() => drive.files.delete({ fileId, supportsAllDrives: true }));
  } catch (error) {
    throw normalizeDriveError(error);
  }
}

export async function streamDriveFile(fileId: string) {
  const drive = await getDriveClient();
  try {
    const metadata = await withDriveRetry(() => drive.files.get({ fileId, fields: 'id,name,mimeType', supportsAllDrives: true }));
    const media = await withDriveRetry(() => drive.files.get({ fileId, alt: 'media', supportsAllDrives: true }, { responseType: 'stream' }));
    return {
      stream: media.data,
      mimeType: metadata.data.mimeType || 'application/octet-stream',
      fileName: metadata.data.name || `${fileId}${path.extname(metadata.data.name || '')}`,
    };
  } catch (error) {
    throw normalizeDriveError(error);
  }
}
