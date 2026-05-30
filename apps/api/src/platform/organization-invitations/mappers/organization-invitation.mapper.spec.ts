import { toOrganizationInvitationResponse } from './organization-invitation.mapper';

describe('toOrganizationInvitationResponse', () => {
  it('maps nested organization data and date fields to transport-safe values', () => {
    const createdAt = new Date('2026-05-30T08:00:00.000Z');
    const expiresAt = new Date('2026-06-01T08:00:00.000Z');

    expect(
      toOrganizationInvitationResponse({
        id: 20n,
        organizationId: 5n,
        email: 'invitee@example.com',
        governanceRole: 'member',
        status: 'pending',
        createdAt,
        updatedAt: createdAt,
        expiresAt,
        organization: {
          id: 5n,
          name: 'Northwind Homes',
          slug: 'northwind-homes',
        },
      }),
    ).toEqual({
      id: '20',
      organizationId: '5',
      email: 'invitee@example.com',
      governanceRole: 'member',
      status: 'pending',
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      acceptedAt: undefined,
      revokedAt: undefined,
      rejectedAt: undefined,
      organization: {
        id: '5',
        name: 'Northwind Homes',
        slug: 'northwind-homes',
      },
    });
  });
});
