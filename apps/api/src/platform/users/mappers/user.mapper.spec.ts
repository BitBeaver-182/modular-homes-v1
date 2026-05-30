import { toUserResponse } from './user.mapper';

describe('toUserResponse', () => {
  it('maps scoped organization and roles into a transport-safe response', () => {
    const response = toUserResponse({
      id: 7n,
      email: 'alex@example.com',
      name: 'Alex Johnson',
      avatarUrl: 'https://example.com/avatar.png',
      organizationUsers: [
        {
          organization: {
            id: 3n,
            name: 'Northwind Homes',
            slug: 'northwind-homes',
            deletedAt: null,
          },
          userRoles: [
            {
              role: {
                id: 11n,
                name: 'Admin',
                description: 'Can manage users',
              },
            },
          ],
        },
      ],
    });

    expect(response).toEqual({
      id: '7',
      email: 'alex@example.com',
      name: 'Alex Johnson',
      avatarUrl: 'https://example.com/avatar.png',
      organization: {
        id: '3',
        name: 'Northwind Homes',
        slug: 'northwind-homes',
      },
      roles: [
        {
          id: '11',
          name: 'Admin',
          description: 'Can manage users',
        },
      ],
    });
  });

  it('drops deleted organization context from the response', () => {
    const response = toUserResponse({
      id: 7n,
      email: 'alex@example.com',
      name: null,
      avatarUrl: null,
      organizationUsers: [
        {
          organization: {
            id: 3n,
            name: 'Northwind Homes',
            slug: 'northwind-homes',
            deletedAt: new Date('2026-05-30T08:00:00.000Z'),
          },
          userRoles: [],
        },
      ],
    });

    expect(response.organization).toBeNull();
    expect(response.roles).toEqual([]);
  });
});
