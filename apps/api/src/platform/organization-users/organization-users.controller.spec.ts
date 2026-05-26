import { OrganizationUsersController } from './organization-users.controller';
import { OrganizationUsersService } from './organization-users.service';

describe('OrganizationUsersController', () => {
  const organizationUsersService = {
    inviteUserToOrganization: jest.fn(),
    activateMembership: jest.fn(),
    grantOwner: jest.fn(),
    transferOwnership: jest.fn(),
  };

  let controller: OrganizationUsersController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new OrganizationUsersController(
      organizationUsersService as unknown as OrganizationUsersService,
    );
  });

  it('routes membership governance calls to service', async () => {
    organizationUsersService.inviteUserToOrganization.mockResolvedValue({
      id: 1n,
      organizationId: 2n,
      governanceRole: 'member',
      status: 'invited',
      user: {
        id: 9n,
        email: 'invite@example.com',
        name: null,
        avatarUrl: null,
      },
    });
    organizationUsersService.activateMembership.mockResolvedValue({
      id: 1n,
      organizationId: 2n,
      governanceRole: 'owner',
      status: 'active',
      user: {
        id: 9n,
        email: 'invite@example.com',
        name: null,
        avatarUrl: null,
      },
    });

    const invitation = await controller.invite(2n, {
      email: 'invite@example.com',
    });
    const activated = await controller.activate(2n, '9');
    await controller.grantOwner(2n, '9');
    await controller.transferOwnership(2n, '10', { fromUserId: '9' });

    expect(
      organizationUsersService.inviteUserToOrganization,
    ).toHaveBeenCalledWith(2n, {
      email: 'invite@example.com',
    });
    expect(organizationUsersService.activateMembership).toHaveBeenCalledWith(
      2n,
      9n,
    );
    expect(organizationUsersService.grantOwner).toHaveBeenCalledWith(2n, 9n);
    expect(organizationUsersService.transferOwnership).toHaveBeenCalledWith(
      2n,
      9n,
      10n,
    );
    expect(invitation.status).toBe('invited');
    expect(activated.status).toBe('active');
  });
});
