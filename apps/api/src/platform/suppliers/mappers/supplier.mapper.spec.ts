import {
  toSupplierAddressResponse,
  toSupplierListResponse,
  toSupplierResponse,
} from './supplier.mapper';

describe('supplier mappers', () => {
  it('maps supplier bigint ids and dates to strings', () => {
    const createdAt = new Date('2026-05-30T08:00:00.000Z');
    const updatedAt = new Date('2026-05-30T09:30:00.000Z');

    expect(
      toSupplierResponse({
        id: 9n,
        name: 'Acme Supply',
        phoneNumber: '+1 555 0100',
        email: 'orders@example.com',
        website: 'https://example.com',
        createdAt,
        updatedAt,
        address: {
          line1: '100 Main Street',
          city: 'Austin',
          region: 'TX',
          postalCode: '78701',
          countryCode: 'US',
          deletedAt: null,
        },
      }),
    ).toEqual({
      id: '9',
      name: 'Acme Supply',
      phoneNumber: '+1 555 0100',
      email: 'orders@example.com',
      website: 'https://example.com',
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      address: {
        fullAddress: '100 Main Street, Austin, TX 78701, US',
        line1: '100 Main Street',
        line2: null,
        city: 'Austin',
        region: 'TX',
        postalCode: '78701',
        countryCode: 'US',
      },
    });
  });

  it('returns null for deleted supplier addresses and preserves pagination metadata', () => {
    expect(
      toSupplierAddressResponse({
        line1: '100 Main Street',
        deletedAt: new Date('2026-05-30T08:00:00.000Z'),
      }),
    ).toBeNull();

    expect(
      toSupplierListResponse(
        [
          {
            id: 9n,
            name: 'Acme Supply',
            phoneNumber: null,
            email: null,
            website: null,
            createdAt: new Date('2026-05-30T08:00:00.000Z'),
            updatedAt: new Date('2026-05-30T09:00:00.000Z'),
            address: null,
          },
        ],
        {
          pagination: {
            page: 1,
            pageSize: 15,
            pageCount: 1,
            total: 1,
          },
        },
      ),
    ).toMatchObject({
      data: [
        {
          id: '9',
          address: null,
        },
      ],
      meta: {
        pagination: {
          page: 1,
          pageSize: 15,
          pageCount: 1,
          total: 1,
        },
      },
    });
  });
});
