import type {
  CreateSupplierOrderInvoiceRequest,
  SupplierOrderInvoiceStatus,
  SupplierOrderInvoiceType,
  UpdateSupplierOrderInvoiceRequest,
} from '@moduflow/types';
import {
  SUPPLIER_ORDER_INVOICE_STATUSES,
  SUPPLIER_ORDER_INVOICE_TYPES,
} from '@moduflow/types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsString,
  IsDateString,
  MaxLength,
  Min,
  IsOptional,
} from 'class-validator';
import {
  emptyStringToUndefined,
  trimString,
} from '../../../common/transforms/string.transforms';

class SupplierOrderInvoiceWriteDto {
  @ApiPropertyOptional({ example: 'file_123', nullable: true })
  @Transform(emptyStringToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  attachmentId?: string | null;

  @ApiProperty({ example: 'INV-2026-001' })
  @Transform(trimString)
  @IsString()
  @MaxLength(255)
  invoiceNumber!: string;

  @ApiProperty({ enum: SUPPLIER_ORDER_INVOICE_TYPES })
  @IsEnum(SUPPLIER_ORDER_INVOICE_TYPES)
  invoiceType!: SupplierOrderInvoiceType;

  @ApiProperty({ enum: SUPPLIER_ORDER_INVOICE_STATUSES })
  @IsEnum(SUPPLIER_ORDER_INVOICE_STATUSES)
  status!: SupplierOrderInvoiceStatus;

  @ApiProperty({ example: '2026-06-03' })
  @Transform(trimString)
  @IsDateString()
  issueDate!: string;

  @ApiProperty({ example: '2026-06-30' })
  @Transform(trimString)
  @IsDateString()
  dueDate!: string;

  @ApiProperty({ example: 1000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  subtotalAmount!: number;

  @ApiProperty({ example: 150 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  taxAmount!: number;

  @ApiPropertyOptional({ example: 'Awaiting remainder', nullable: true })
  @Transform(emptyStringToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string | null;
}

export class CreateSupplierOrderInvoiceDto
  extends SupplierOrderInvoiceWriteDto
  implements CreateSupplierOrderInvoiceRequest {}

export class UpdateSupplierOrderInvoiceDto
  extends SupplierOrderInvoiceWriteDto
  implements UpdateSupplierOrderInvoiceRequest {}
