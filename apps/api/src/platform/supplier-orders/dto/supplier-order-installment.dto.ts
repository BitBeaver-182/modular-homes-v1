import type {
  CreateSupplierOrderInvoiceInstallmentRequest,
  UpdateSupplierOrderInvoiceInstallmentRequest,
} from '@moduflow/types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
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

class SupplierOrderInstallmentWriteDto {
  @ApiProperty({ example: '2026-07-15' })
  @Transform(trimString)
  @IsDateString()
  dueDate!: string;

  @ApiProperty({ example: 500 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amountDue!: number;

  @ApiPropertyOptional({ example: 'Deposit due on booking', nullable: true })
  @Transform(emptyStringToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string | null;
}

export class CreateSupplierOrderInvoiceInstallmentDto
  extends SupplierOrderInstallmentWriteDto
  implements CreateSupplierOrderInvoiceInstallmentRequest {}

export class UpdateSupplierOrderInvoiceInstallmentDto
  extends SupplierOrderInstallmentWriteDto
  implements UpdateSupplierOrderInvoiceInstallmentRequest {}
