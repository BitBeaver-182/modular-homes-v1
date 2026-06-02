import {
  createApiErrorDetail,
  createBadRequestException,
} from '../errors/api-error';

type BigIntIdInput = bigint | number | string | null | undefined;

function toFieldPath(fieldName: string): string[] {
  return fieldName
    .split('.')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}

function throwInvalidBigIntId(fieldName: string): never {
  throw createBadRequestException(`${fieldName} must be a positive integer`, [
    createApiErrorDetail({
      path: toFieldPath(fieldName),
      message: `${fieldName} must be a positive integer`,
      name: 'ValidationError',
      key: 'validation.positiveInteger',
    }),
  ]);
}

export function parseBigIntId(value: BigIntIdInput, fieldName = 'id'): bigint {
  if (typeof value === 'bigint') {
    if (value > 0n) {
      return value;
    }
    throwInvalidBigIntId(fieldName);
  }

  if (typeof value === 'number') {
    if (Number.isSafeInteger(value) && value > 0) {
      return BigInt(value);
    }
    throwInvalidBigIntId(fieldName);
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    if (/^[1-9]\d*$/.test(trimmedValue)) {
      return BigInt(trimmedValue);
    }
  }

  throwInvalidBigIntId(fieldName);
}
