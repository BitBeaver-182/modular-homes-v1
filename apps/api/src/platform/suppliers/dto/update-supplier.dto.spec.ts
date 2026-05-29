import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { UpdateSupplierDto } from './update-supplier.dto';

describe('UpdateSupplierDto', () => {
  it('allows clearing a supplier address with blank nested fields', () => {
    const dto = plainToInstance(UpdateSupplierDto, {
      address: {
        line1: '',
        line2: '',
        city: '',
        region: '',
        postalCode: '',
        countryCode: '',
      },
    });

    const errors = validateSync(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors).toHaveLength(0);
    expect(dto.address).toEqual({
      line1: undefined,
      line2: undefined,
      city: undefined,
      region: undefined,
      postalCode: undefined,
      countryCode: undefined,
    });
  });

  it('preserves blank scalar fields so updates can clear them', () => {
    const dto = plainToInstance(UpdateSupplierDto, {
      phoneNumber: '   ',
      email: '   ',
      website: '   ',
    });

    const errors = validateSync(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors).toHaveLength(0);
    expect(dto.phoneNumber).toBe('');
    expect(dto.email).toBe('');
    expect(dto.website).toBe('');
  });
});
