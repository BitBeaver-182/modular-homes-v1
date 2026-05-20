import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';

describe('OrganizationsController', () => {
  const organizationsService = {
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
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

  it('routes base CRUD calls to service', async () => {
    const createDto = { name: 'Acme', slug: 'acme' };
    const updateDto = { name: 'Acme 2' };

    await controller.create(createDto);
    await controller.findAll();
    await controller.findOne('2');
    await controller.update('2', updateDto);
    await controller.remove('2');

    expect(organizationsService.create).toHaveBeenCalledWith(createDto);
    expect(organizationsService.findAll).toHaveBeenCalledTimes(1);
    expect(organizationsService.findOne).toHaveBeenCalledWith(2n);
    expect(organizationsService.update).toHaveBeenCalledWith(2n, updateDto);
    expect(organizationsService.remove).toHaveBeenCalledWith(2n);
  });

  it('rejects malformed ids before hitting service', () => {
    expect(() => controller.findOne('abc')).toThrow();
    expect(() => controller.addUserToOrganization('2', 'abc')).toThrow();

    expect(organizationsService.findOne).not.toHaveBeenCalled();
    expect(organizationsService.attachUser).not.toHaveBeenCalled();
  });
});
