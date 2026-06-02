import { Module } from '@nestjs/common';
import { StorageModule } from '../../storage/storage.module';
import { SupplierOrdersController } from './supplier-orders.controller';
import { SupplierOrdersService } from './supplier-orders.service';

@Module({
  imports: [StorageModule],
  controllers: [SupplierOrdersController],
  providers: [SupplierOrdersService],
  exports: [SupplierOrdersService],
})
export class SupplierOrdersModule {}
