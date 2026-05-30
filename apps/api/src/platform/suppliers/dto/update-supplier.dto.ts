import type {
  UpdateSupplierAddressRequest,
  UpdateSupplierRequest,
} from '@moduflow/types';
import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsISO31661Alpha2,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import { CreateSupplierDto } from './create-supplier.dto';
import { SupplierAddressDto } from './supplier-address.dto';
import { IsGooglePhoneNumber } from '../../../common/validators/is-google-phone-number';

const emptyToUndefined = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const trimUppercaseString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

export class UpdateSupplierAddressDto
  extends PartialType(SupplierAddressDto)
  implements UpdateSupplierAddressRequest
{
  @ApiPropertyOptional({
    example: '100 Main Street',
    maxLength: 200,
  })
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
  @Transform(trimUppercaseString)
  @IsOptional()
  @IsString()
  @IsISO31661Alpha2()
  countryCode?: string;
}

class UpdateSupplierBaseDto extends PartialType(
  OmitType(CreateSupplierDto, [
    'address',
    'phoneNumber',
    'email',
    'website',
  ] as const),
) {}

export class UpdateSupplierDto
  extends UpdateSupplierBaseDto
  implements UpdateSupplierRequest
{
  @ApiPropertyOptional({ example: '+1 555 0100' })
  @Transform(trimString)
  @ValidateIf((_, value: unknown) => value !== '')
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @IsGooglePhoneNumber()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'orders@example.com' })
  @Transform(trimString)
  @ValidateIf((_, value: unknown) => value !== '')
  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  email?: string;

  @ApiPropertyOptional({ type: UpdateSupplierAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateSupplierAddressDto)
  address?: UpdateSupplierAddressDto;

  @ApiPropertyOptional({ example: 'https://example.com' })
  @Transform(trimString)
  @ValidateIf((_, value: unknown) => value !== '')
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  website?: string;
}
