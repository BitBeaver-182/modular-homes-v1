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
    organizationsService.attachUser.mockResolvedValue({
      id: 1n,
      organizationId: 2n,
      userId: 9n,
      role: 'member',
      deletedAt: null,
    });
    organizationsService.detachUser.mockResolvedValue({
      id: 1n,
      organizationId: 2n,
      userId: 9n,
      role: 'member',
      deletedAt: new Date().toISOString(),
    });

    const attached = await controller.addUserToOrganization('2', '9');
    const detached = await controller.removeUserFromOrganization('2', '9');

    expect(organizationsService.attachUser).toHaveBeenCalledWith(2n, 9n);
    expect(organizationsService.detachUser).toHaveBeenCalledWith(2n, 9n);
    expect(attached.userId).toBeUndefined();
    expect(detached.deletedAt).toBeUndefined();
  });

  it('routes base CRUD calls to service', async () => {
    const createDto = { name: 'Acme', slug: 'acme' };
    const updateDto = { name: 'Acme 2' };
    const rawOrganization = {
      id: 2n,
      name: 'Acme',
      slug: 'acme',
      deletedAt: null,
    };

    organizationsService.create.mockResolvedValue(rawOrganization);
    organizationsService.findAll.mockResolvedValue([rawOrganization]);
    organizationsService.findOne.mockResolvedValue(rawOrganization);
    organizationsService.update.mockResolvedValue(rawOrganization);
    organizationsService.remove.mockResolvedValue(rawOrganization);

    const created = await controller.create(createDto);
    const list = await controller.findAll();
    const one = await controller.findOne('2');
    const updated = await controller.update('2', updateDto);
    const removed = await controller.remove('2');

    expect(organizationsService.create).toHaveBeenCalledWith(createDto);
    expect(organizationsService.findAll).toHaveBeenCalledTimes(1);
    expect(organizationsService.findOne).toHaveBeenCalledWith(2n);
    expect(organizationsService.update).toHaveBeenCalledWith(2n, updateDto);
    expect(organizationsService.remove).toHaveBeenCalledWith(2n);
    expect(created.deletedAt).toBeUndefined();
    expect(list[0].deletedAt).toBeUndefined();
    expect(one.slug).toBe('acme');
    expect(updated.name).toBe('Acme');
    expect(removed.id).toBe(2n);
  });

  it('rejects malformed ids before hitting service', async () => {
    await expect(controller.findOne('abc')).rejects.toThrow();
    await expect(
      controller.addUserToOrganization('2', 'abc'),
    ).rejects.toThrow();

    expect(organizationsService.findOne).not.toHaveBeenCalled();
    expect(organizationsService.attachUser).not.toHaveBeenCalled();
  });
});
