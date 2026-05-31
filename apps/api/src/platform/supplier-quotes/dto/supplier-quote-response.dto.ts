import type {
  FileUploadResponse as FileUploadContract,
  SupplierQuoteLineResponse as SupplierQuoteLineContract,
  SupplierQuoteListResponse as SupplierQuoteListContract,
  SupplierQuoteResponse as SupplierQuoteContract,
  SupplierQuoteStatus,
} from '@moduflow/types';
import { SUPPLIER_QUOTE_STATUSES } from '@moduflow/types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { createPaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { FileUploadPresenter } from '../../../uploads/presenters/file-upload.presenter';
import { SupplierResponse } from '../../suppliers/dto/supplier-response.dto';

export class SupplierQuoteLineResponse implements SupplierQuoteLineContract {
  constructor(partial: SupplierQuoteLineContract) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: '1' })
  @Expose()
  id!: string;

  @ApiPropertyOptional({ example: '12', nullable: true })
  @Expose()
  houseModelId!: string | null;

  @ApiPropertyOptional({ example: '25', nullable: true })
  @Expose()
  productConfigurationId!: string | null;

  @ApiPropertyOptional({ example: 'Two-bedroom modular home shell' })
  @Expose()
  description!: string | null;

  @ApiProperty({ example: 2 })
  @Expose()
  quantity!: number;

  @ApiProperty({ example: 25000 })
  @Expose()
  unitCost!: number;

  @ApiProperty({ example: 50000 })
  @Expose()
  lineTotal!: number;

  @ApiPropertyOptional({ example: 45, nullable: true })
  @Expose()
  estimatedProductionDays!: number | null;

  @ApiPropertyOptional({ example: 'Includes standard fixture package' })
  @Expose()
  notes!: string | null;

  @ApiProperty()
  @Expose()
  createdAt!: string;

  @ApiProperty()
  @Expose()
  updatedAt!: string;
}

export class SupplierQuoteResponse implements SupplierQuoteContract {
  constructor(partial: SupplierQuoteContract) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: '1' })
  @Expose()
  id!: string;

  @ApiProperty({ type: SupplierResponse })
  @Expose()
  @Type(() => SupplierResponse)
  supplier!: SupplierResponse;

  @ApiPropertyOptional({ type: FileUploadPresenter, nullable: true })
  @Expose()
  @Type(() => FileUploadPresenter)
  attachment!: FileUploadContract | null;

  @ApiPropertyOptional({ example: 'SQ-2026-001', nullable: true })
  @Expose()
  quoteNumber!: string | null;

  @ApiProperty({ enum: SUPPLIER_QUOTE_STATUSES })
  @Expose()
  status!: SupplierQuoteStatus;

  @ApiPropertyOptional({ example: '2026-05-30', nullable: true })
  @Expose()
  quoteDate!: string | null;

  @ApiPropertyOptional({ example: '2026-06-30', nullable: true })
  @Expose()
  validUntil!: string | null;

  @ApiProperty({ example: 'USD' })
  @Expose()
  currencyCode!: string;

  @ApiProperty({ example: 50000 })
  @Expose()
  subtotalAmount!: number;

  @ApiProperty({ example: 1200 })
  @Expose()
  shippingAmount!: number;

  @ApiProperty({ example: 450 })
  @Expose()
  taxAmount!: number;

  @ApiProperty({ example: 51650 })
  @Expose()
  totalAmount!: number;

  @ApiPropertyOptional({ example: '50% deposit, net 30', nullable: true })
  @Expose()
  paymentTerms!: string | null;

  @ApiPropertyOptional({ example: 'Supplier confirmed production slot.' })
  @Expose()
  notes!: string | null;

  @ApiPropertyOptional({ nullable: true })
  @Expose()
  statusUpdatedAt!: string | null;

  @ApiPropertyOptional({ example: '1', nullable: true })
  @Expose()
  statusUpdatedByUserId!: string | null;

  @ApiProperty({ type: SupplierQuoteLineResponse, isArray: true })
  @Expose()
  @Type(() => SupplierQuoteLineResponse)
  lines!: SupplierQuoteLineResponse[];

  @ApiProperty()
  @Expose()
  createdAt!: string;

  @ApiProperty()
  @Expose()
  updatedAt!: string;
}

export class SupplierQuoteListResponse
  extends createPaginatedResponseDto(SupplierQuoteResponse)
  implements SupplierQuoteListContract {}
