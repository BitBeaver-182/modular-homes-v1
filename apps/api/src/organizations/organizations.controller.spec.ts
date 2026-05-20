import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';

describe('OrganizationsController', () => {
  const organizationsService = {
    attachUser: jest.fn(),
    detachUser: jest.fn(),
    findAll: jest.fn(),
  };

  let controller: OrganizationsController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new OrganizationsController(
      organizationsService as unknown as OrganizationsService,
    );
  });

  it('supports nested org-user routes', async () => {
    await controller.addUserToOrganization('2', '9');
    await controller.removeUserFromOrganization('2', '9');

    expect(organizationsService.attachUser).toHaveBeenCalledWith(2n, 9n);
    expect(organizationsService.detachUser).toHaveBeenCalledWith(2n, 9n);
  });
});
