import type {
  CreateSupplierOrderInvoicePaymentRequest,
  SupplierOrderInvoicePaymentMethod,
  UpdateSupplierOrderInvoicePaymentRequest,
} from '@moduflow/types';
import { SUPPLIER_ORDER_INVOICE_PAYMENT_METHODS } from '@moduflow/types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  emptyStringToUndefined,
  trimString,
} from '../../../common/transforms/string.transforms';

class SupplierOrderPaymentWriteDto {
  @ApiPropertyOptional({ example: 'PAY-2026-0001', nullable: true })
  @Transform(emptyStringToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  paymentReference?: string | null;

  @ApiProperty({ enum: SUPPLIER_ORDER_INVOICE_PAYMENT_METHODS })
  @IsEnum(SUPPLIER_ORDER_INVOICE_PAYMENT_METHODS)
  paymentMethod!: SupplierOrderInvoicePaymentMethod;

  @ApiProperty({ example: '2026-06-15' })
  @Transform(trimString)
  @IsDateString()
  paymentDate!: string;

  @ApiProperty({ example: 500 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({ example: 'NL12BANK0123456789', nullable: true })
  @Transform(emptyStringToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bankAccount?: string | null;

  @ApiPropertyOptional({ example: 'TRX-123456', nullable: true })
  @Transform(emptyStringToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  transactionId?: string | null;

  @ApiPropertyOptional({ example: 'Paid before customs release', nullable: true })
  @Transform(emptyStringToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string | null;

  @ApiPropertyOptional({ example: '19', nullable: true })
  @Transform(emptyStringToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  invoiceInstallmentId?: string | null;
}

export class CreateSupplierOrderInvoicePaymentDto
  extends SupplierOrderPaymentWriteDto
  implements CreateSupplierOrderInvoicePaymentRequest {}

export class UpdateSupplierOrderInvoicePaymentDto
  extends SupplierOrderPaymentWriteDto
  implements UpdateSupplierOrderInvoicePaymentRequest {}
