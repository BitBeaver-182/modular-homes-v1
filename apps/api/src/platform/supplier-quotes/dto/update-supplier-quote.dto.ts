import type { UpdateSupplierQuoteRequest } from '@moduflow/types';
import { PartialType } from '@nestjs/swagger';
import { CreateSupplierQuoteDto } from './create-supplier-quote.dto';

export class UpdateSupplierQuoteDto
  extends PartialType(CreateSupplierQuoteDto)
  implements UpdateSupplierQuoteRequest {}
