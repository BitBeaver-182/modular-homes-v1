import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../../storage/storage.service';

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
}
