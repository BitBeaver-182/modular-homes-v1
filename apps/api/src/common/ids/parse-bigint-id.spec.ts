import { BadRequestException } from '@nestjs/common';
import { parseBigIntId } from './parse-bigint-id';

describe('parseBigIntId', () => {
  it('accepts positive integer inputs', () => {
    expect(parseBigIntId('12')).toBe(12n);
    expect(parseBigIntId(12)).toBe(12n);
    expect(parseBigIntId(12n)).toBe(12n);
  });

  it('rejects invalid ids with a bad request error', () => {
    expect(() => parseBigIntId('abc')).toThrow(BadRequestException);
    expect(() => parseBigIntId('0')).toThrow(BadRequestException);
    expect(() => parseBigIntId(undefined)).toThrow(BadRequestException);
  });
});
