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
import { IsGooglePhoneNumber } from '../../../common/validators/is-google-phone-number';
import { SupplierAddressDto } from './supplier-address.dto';

const emptyToUndefined = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateSupplierDto {
  @ApiProperty({ example: 'Acme Supply' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ example: '+1 555 0100' })
  @Transform(emptyToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @IsGooglePhoneNumber()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'orders@example.com' })
  @Transform(emptyToUndefined)
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
  @Transform(emptyToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  website?: string;
}
