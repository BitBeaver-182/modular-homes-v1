import type { CreateSupplierRequest } from '@moduflow/types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import {
  emptyStringToUndefined,
  trimString,
} from '../../../common/transforms/string.transforms';
import { IsGooglePhoneNumber } from '../../../common/validators/is-google-phone-number';
import { SupplierAddressDto } from './supplier-address.dto';

export class CreateSupplierDto implements CreateSupplierRequest {
  @ApiProperty({ example: 'Acme Supply' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ example: '+1 555 0100' })
  @Transform(emptyStringToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @IsGooglePhoneNumber()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'orders@example.com' })
  @Transform(emptyStringToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  email?: string;

  @ApiPropertyOptional({ type: SupplierAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SupplierAddressDto)
  address?: SupplierAddressDto;

  @ApiPropertyOptional({ example: 'https://example.com' })
  @Transform(emptyStringToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  website?: string;
}
