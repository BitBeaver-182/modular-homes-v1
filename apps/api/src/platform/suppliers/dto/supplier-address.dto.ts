import type { SupplierAddressRequest } from '@moduflow/types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsISO31661Alpha2,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const trimUppercaseString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

export class SupplierAddressDto implements SupplierAddressRequest {
  @ApiProperty({
    example: '100 Main Street',
    maxLength: 200,
  })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  line1!: string;

  @ApiPropertyOptional({ example: 'Suite 200', maxLength: 200 })
  @Transform(emptyToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  line2?: string;

  @ApiPropertyOptional({ example: 'Austin', maxLength: 120 })
  @Transform(emptyToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @ApiPropertyOptional({ example: 'TX', maxLength: 120 })
  @Transform(emptyToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  region?: string;

  @ApiPropertyOptional({ example: '78701', maxLength: 40 })
  @Transform(emptyToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  postalCode?: string;

  @ApiPropertyOptional({
    description: 'ISO 3166-1 alpha-2 country code.',
    example: 'US',
  })
  @Transform(emptyToUndefined)
  @Transform(trimUppercaseString)
  @IsOptional()
  @IsString()
  @IsISO31661Alpha2()
  countryCode?: string;
}
