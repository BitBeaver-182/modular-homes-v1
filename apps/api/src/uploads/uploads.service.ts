import type {
  FileContext,
  FileUploadResponse,
  PresignUploadRequest,
  PresignUploadResponse,
} from '@moduflow/types';
import { createId } from '@paralleldrive/cuid2';
import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedActor } from '../auth/auth.types';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { FileUploadMapper } from './mappers/file-upload.mapper';

export const UPLOAD_WINDOW_SECONDS = 300;
const READ_URL_TTL_SECONDS = 3600;

@Injectable()
export class UploadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async presign(
    dto: PresignUploadRequest,
    actor: AuthenticatedActor,
  ): Promise<PresignUploadResponse> {
    const fileId = createId();
    const key = buildStorageKey(actor.organizationId, dto.context, fileId);
    const bucket = this.storageService.bucketForContext(dto.context);
    const expiresAt = new Date(Date.now() + UPLOAD_WINDOW_SECONDS * 1000);

    await this.prisma.fileUpload.create({
      data: {
        id: fileId,
        organizationId: actor.organizationId,
        uploadedById: actor.userId,
        bucket,
        key,
        filename: dto.filename,
        mimeType: dto.mimeType,
        context: dto.context,
        status: 'PENDING',
        expiresAt,
      },
    });

    const { uploadUrl } = await this.storageService.presignUpload(
      dto.context,
      key,
      dto.mimeType,
    );

    return {
      fileId,
      uploadUrl,
      expiresIn: UPLOAD_WINDOW_SECONDS,
    };
  }

  async confirm(
    fileId: string,
    actor: AuthenticatedActor,
  ): Promise<FileUploadResponse> {
    const fileUpload = await this.prisma.fileUpload.findFirst({
      where: {
        id: fileId,
        organizationId: actor.organizationId,
        status: 'PENDING',
      },
    });

    if (!fileUpload) {
      throw new NotFoundException('File upload not found');
    }

    if (isExpired(fileUpload.expiresAt)) {
      await this.storageService.delete(fileUpload.context, fileUpload.key);
      await this.prisma.fileUpload.updateMany({
        where: {
          id: fileId,
          organizationId: actor.organizationId,
          status: 'PENDING',
        },
        data: { status: 'ORPHANED' },
      });
      throw new NotFoundException('File upload not found');
    }

    const objectExists = await this.storageService.exists(
      fileUpload.context,
      fileUpload.key,
    );

    if (!objectExists) {
      throw new NotFoundException('File upload not found');
    }

    await this.prisma.fileUpload.updateMany({
      where: {
        id: fileId,
        organizationId: actor.organizationId,
        status: 'PENDING',
      },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
    });

    const confirmedUpload = await this.prisma.fileUpload.findFirst({
      where: {
        id: fileId,
        organizationId: actor.organizationId,
        status: 'CONFIRMED',
      },
    });

    if (!confirmedUpload) {
      throw new NotFoundException('File upload not found');
    }

    return FileUploadMapper.toResponse(confirmedUpload, this.storageService);
  }

  async getSignedUrl(
    fileId: string,
    actor: AuthenticatedActor,
  ): Promise<string> {
    const fileUpload = await this.prisma.fileUpload.findFirst({
      where: {
        id: fileId,
        organizationId: actor.organizationId,
        status: 'CONFIRMED',
      },
    });

    if (!fileUpload) {
      throw new NotFoundException('File upload not found');
    }

    return this.storageService.readUrl(
      fileUpload.context,
      fileUpload.key,
      READ_URL_TTL_SECONDS,
    );
  }
}

export function buildStorageKey(
  organizationId: bigint,
  context: FileContext,
  fileId: string,
): string {
  return `${organizationId.toString()}/${context}/${fileId}`;
}

function isExpired(expiresAt: Date | null): boolean {
  return expiresAt !== null && expiresAt.getTime() <= Date.now();
}
