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

  it('preserves field path and translation key for invalid ids', () => {
    try {
      parseBigIntId('abc', 'supplierId');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const response = (error as BadRequestException).getResponse() as {
        message: string;
        errors: Array<{
          path: string[];
          message: string;
          name: string;
          key: string;
        }>;
      };

      expect(response).toEqual({
        message: 'supplierId must be a positive integer',
        errors: [
          {
            path: ['supplierId'],
            message: 'supplierId must be a positive integer',
            name: 'ValidationError',
            key: 'validation.positiveInteger',
          },
        ],
      });
      return;
    }

    throw new Error('Expected parseBigIntId to throw');
  });
});
