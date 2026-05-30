import { toOrganizationMembershipResponse } from './organization-membership.mapper';

describe('toOrganizationMembershipResponse', () => {
  it('maps bigint identifiers into string transport fields', () => {
    expect(
      toOrganizationMembershipResponse({
        id: 10n,
        organizationId: 5n,
        governanceRole: 'owner',
        status: 'active',
        user: {
          id: 7n,
          email: 'owner@example.com',
          name: 'Owner User',
          avatarUrl: null,
        },
      }),
    ).toEqual({
      id: '10',
      organizationId: '5',
      governanceRole: 'owner',
      status: 'active',
      user: {
        id: '7',
        email: 'owner@example.com',
        name: 'Owner User',
        avatarUrl: null,
      },
    });
  });
});
