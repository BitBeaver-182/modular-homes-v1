import { BadRequestException } from '@nestjs/common';

type BigIntIdInput = bigint | number | string | null | undefined;

export function parseBigIntId(value: BigIntIdInput, fieldName = 'id'): bigint {
  if (typeof value === 'bigint') {
    if (value > 0n) {
      return value;
    }
    throw new BadRequestException(`${fieldName} must be a positive integer`);
  }

  if (typeof value === 'number') {
    if (Number.isSafeInteger(value) && value > 0) {
      return BigInt(value);
    }
    throw new BadRequestException(`${fieldName} must be a positive integer`);
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    if (/^[1-9]\d*$/.test(trimmedValue)) {
      return BigInt(trimmedValue);
    }
  }

  throw new BadRequestException(`${fieldName} must be a positive integer`);
}
