import type {
  FileContext as PrismaFileContext,
  FileUploadStatus as PrismaFileUploadStatus,
} from '@prisma/client';
import type { FileContext, FileUploadStatus } from '@moduflow/types';

type Assert<T extends true> = T;

type FileContextMatchesPrisma = Assert<
  PrismaFileContext extends FileContext ? true : false
>;

type FileUploadStatusMatchesPrisma = Assert<
  PrismaFileUploadStatus extends FileUploadStatus ? true : false
>;

export type UploadEnumAlignment = [
  FileContextMatchesPrisma,
  FileUploadStatusMatchesPrisma,
];
