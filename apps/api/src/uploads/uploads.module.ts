import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { StorageModule } from '../storage/storage.module';
import { OrphanCleanupTask } from './tasks/orphan-cleanup.task';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Module({
  imports: [DatabaseModule, StorageModule],
  controllers: [UploadsController],
  providers: [UploadsService, OrphanCleanupTask],
  exports: [UploadsService],
})
export class UploadsModule {}
