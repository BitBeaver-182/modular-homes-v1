import type { CreateSupplierOrderRequest } from '@moduflow/types';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MaxLength } from 'class-validator';
import { trimString } from '../../../common/transforms/string.transforms';

export class CreateSupplierOrderDto implements CreateSupplierOrderRequest {
  @ApiProperty({ example: '12' })
  @Transform(trimString)
  @IsString()
  @MaxLength(40)
  quoteId!: string;
}
