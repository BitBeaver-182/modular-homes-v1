import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../../storage/storage.service';

const STALE_CONFIRMED_SUPPLIER_UPLOAD_WINDOW_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class OrphanCleanupTask {
  private readonly logger = new Logger(OrphanCleanupTask.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredPendingUploads(): Promise<void> {
    const expiredUploads = await this.prisma.fileUpload.findMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: new Date() },
      },
    });

    let cleanedCount = 0;

    for (const upload of expiredUploads) {
      await this.storageService.delete(upload.context, upload.key);
      await this.prisma.fileUpload.updateMany({
        where: {
          id: upload.id,
          organizationId: upload.organizationId,
          status: 'PENDING',
        },
        data: { status: 'ORPHANED' },
      });
      cleanedCount += 1;
    }

    this.logger.log(`Cleaned ${cleanedCount} expired pending uploads`);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupDeletedUploads(): Promise<void> {
    const deletedUploads = await this.prisma.fileUpload.findMany({
      where: {
        status: 'DELETED',
      },
    });

    let cleanedCount = 0;

    for (const upload of deletedUploads) {
      try {
        await this.storageService.delete(upload.context, upload.key);
        cleanedCount += 1;
      } catch (error) {
        this.logger.warn(
          `Failed to delete retired upload ${upload.id}: ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
      }
    }

    this.logger.log(`Retried ${cleanedCount} retired upload deletions`);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupStaleConfirmedSupplierUploads(): Promise<void> {
    const cutoff = new Date(
      Date.now() - STALE_CONFIRMED_SUPPLIER_UPLOAD_WINDOW_MS,
    );
    const staleUploads = await this.prisma.fileUpload.findMany({
      where: {
        status: 'CONFIRMED',
        context: 'SUPPLIER_DOCUMENT',
        confirmedAt: { lt: cutoff },
        OR: [
          { supplierQuote: null },
          { supplierQuote: { is: { deletedAt: { not: null } } } },
        ],
      },
    });

    let cleanedCount = 0;

    for (const upload of staleUploads) {
      await this.prisma.fileUpload.updateMany({
        where: {
          id: upload.id,
          organizationId: upload.organizationId,
          status: 'CONFIRMED',
        },
        data: {
          status: 'DELETED',
        },
      });

      try {
        await this.storageService.delete(upload.context, upload.key);
      } catch (error) {
        this.logger.warn(
          `Failed to delete stale confirmed upload ${upload.id}: ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
      }

      cleanedCount += 1;
    }

    this.logger.log(`Retired ${cleanedCount} stale confirmed supplier uploads`);
  }
}
