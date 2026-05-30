import { Module } from '@nestjs/common';
import { StorageModule } from '../../storage/storage.module';
import { SupplierQuotesController } from './supplier-quotes.controller';
import { SupplierQuotesService } from './supplier-quotes.service';

@Module({
  imports: [StorageModule],
  controllers: [SupplierQuotesController],
  providers: [SupplierQuotesService],
  exports: [SupplierQuotesService],
})
export class SupplierQuotesModule {}
