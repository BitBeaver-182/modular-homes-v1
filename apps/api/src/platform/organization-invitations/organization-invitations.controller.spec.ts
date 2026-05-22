import { OrganizationInvitationsController } from './organization-invitations.controller';
import { OrganizationInvitationsService } from './organization-invitations.service';

describe('OrganizationInvitationsController', () => {
  const organizationInvitationsService = {
    findPendingInvitationsForEmail: jest.fn(),
    createInvitation: jest.fn(),
    acceptInvitation: jest.fn(),
  };

  let controller: OrganizationInvitationsController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new OrganizationInvitationsController(
      organizationInvitationsService as unknown as OrganizationInvitationsService,
    );
  });

  it('routes invitation calls to service', async () => {
    organizationInvitationsService.findPendingInvitationsForEmail.mockResolvedValue(
      [
        {
          id: 4n,
          organizationId: 2n,
          email: 'invitee@example.com',
          governanceRole: 'member',
          status: 'pending',
          organization: {
            id: 2n,
            name: 'Acme',
            slug: 'acme',
          },
        },
      ],
    );
    organizationInvitationsService.createInvitation.mockResolvedValue({
      id: 1n,
      organizationId: 2n,
      email: 'invitee@example.com',
      governanceRole: 'member',
      status: 'pending',
    });
    organizationInvitationsService.acceptInvitation.mockResolvedValue(
      undefined,
    );

    const invitations = await controller.findMine({
      userId: 9n,
      email: 'invitee@example.com',
    });
    const invitation = await controller.create(2n, {
      email: 'invitee@example.com',
      governanceRole: 'member',
    });
    await controller.accept('1', { userId: 9n, email: 'invitee@example.com' });

    expect(
      organizationInvitationsService.createInvitation,
    ).toHaveBeenCalledWith(2n, {
      email: 'invitee@example.com',
      governanceRole: 'member',
    });
    expect(
      organizationInvitationsService.findPendingInvitationsForEmail,
    ).toHaveBeenCalledWith('invitee@example.com');
    expect(
      organizationInvitationsService.acceptInvitation,
    ).toHaveBeenCalledWith(1n, {
      userId: 9n,
      email: 'invitee@example.com',
    });
    expect(invitations).toHaveLength(1);
    expect(invitations[0]?.organization?.name).toBe('Acme');
    expect(invitation.status).toBe('pending');
  });
});
