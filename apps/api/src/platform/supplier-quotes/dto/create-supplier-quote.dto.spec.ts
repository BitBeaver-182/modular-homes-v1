import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateSupplierQuoteDto } from './create-supplier-quote.dto';

describe('CreateSupplierQuoteDto', () => {
  it('requires supplier, valid-until date, and subtotal amount when creating quotes', async () => {
    const dto = plainToInstance(CreateSupplierQuoteDto, {
      supplierId: '',
      validUntil: '',
    });

    const errors = await validate(dto);
    const errorProperties = errors.map((error) => error.property);

    expect(errorProperties).toEqual(
      expect.arrayContaining(['supplierId', 'validUntil', 'subtotalAmount']),
    );
  });
});
