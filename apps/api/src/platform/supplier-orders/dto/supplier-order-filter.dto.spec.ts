import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { SupplierOrderFilterDto } from './supplier-order-filter.dto';

describe('SupplierOrderFilterDto', () => {
  it('accepts repeated status and supplierIds filters', () => {
    const dto = plainToInstance(SupplierOrderFilterDto, {
      status: ['draft', 'processing'],
      supplierIds: ['7', '8'],
      createdFrom: '2026-06-01',
      createdTo: '2026-06-30',
      sortField: 'supplier.name',
      sortCriteria: 'asc',
    });

    const errors = validateSync(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors).toHaveLength(0);
    expect(dto.status).toEqual(['draft', 'processing']);
    expect(dto.supplierIds).toEqual(['7', '8']);
  });

  it('rejects invalid dates', () => {
    const dto = plainToInstance(SupplierOrderFilterDto, {
      createdFrom: 'not-a-date',
    });

    const errors = validateSync(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors).not.toHaveLength(0);
  });
});
