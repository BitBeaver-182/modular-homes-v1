import { OrganizationInvitationsController } from './organization-invitations.controller';
import { OrganizationInvitationsService } from './organization-invitations.service';

describe('OrganizationInvitationsController', () => {
  const organizationInvitationsService = {
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
      organizationInvitationsService.acceptInvitation,
    ).toHaveBeenCalledWith(1n, {
      userId: 9n,
      email: 'invitee@example.com',
    });
    expect(invitation.status).toBe('pending');
  });
});
