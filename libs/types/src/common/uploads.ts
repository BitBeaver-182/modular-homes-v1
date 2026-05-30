import type { ApiId, IsoDateString } from './index';

export const FILE_CONTEXTS = [
  'AVATAR',
  'ORGANIZATION_LOGO',
  'SUPPLIER_DOCUMENT',
] as const;

export type FileContext = (typeof FILE_CONTEXTS)[number];

export const FILE_UPLOAD_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'ORPHANED',
  'DELETED',
] as const;

export type FileUploadStatus = (typeof FILE_UPLOAD_STATUSES)[number];

export interface PresignUploadRequest {
  filename: string;
  mimeType: string;
  context: FileContext;
}

export interface PresignUploadResponse {
  fileId: ApiId;
  uploadUrl: string;
  expiresIn: number;
}

export interface FileUploadResponse {
  id: ApiId;
  filename: string;
  mimeType: string;
  url: string;
  context: FileContext;
  status: FileUploadStatus;
  uploadedAt: IsoDateString;
}
