import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class SupplierAddressDto {
  @ApiProperty({
    description: 'Complete human-readable address.',
    example: '100 Main Street, Austin, TX 78701, US',
    maxLength: 500,
  })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  fullAddress!: string;

  @ApiPropertyOptional({ example: '100 Main Street', maxLength: 200 })
  @Transform(emptyToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  line1?: string;

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
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @Length(2, 2)
  countryCode?: string;
}
