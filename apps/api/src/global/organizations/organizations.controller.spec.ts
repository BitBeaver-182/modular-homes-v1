import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';

describe('OrganizationsController', () => {
  const organizationsService = {
    createForUser: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    removeForUser: jest.fn(),
    findAll: jest.fn(),
  };

  let controller: OrganizationsController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new OrganizationsController(
      organizationsService as unknown as OrganizationsService,
    );
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

    organizationsService.createForUser.mockResolvedValue(rawOrganization);
    organizationsService.findAll.mockResolvedValue([rawOrganization]);
    organizationsService.findOne.mockResolvedValue(rawOrganization);
    organizationsService.update.mockResolvedValue(rawOrganization);
    organizationsService.removeForUser.mockResolvedValue(rawOrganization);

    const created = await controller.create(
      { userId: 7n, email: 'owner@example.com' },
      createDto,
    );
    const list = await controller.findAll();
    const one = await controller.findOne('2');
    const updated = await controller.update('2', updateDto);
    const removed = await controller.remove(
      { userId: 7n, email: 'owner@example.com' },
      '2',
    );

    expect(organizationsService.createForUser).toHaveBeenCalledWith(
      7n,
      createDto,
    );
    expect(organizationsService.findAll).toHaveBeenCalledTimes(1);
    expect(organizationsService.findOne).toHaveBeenCalledWith(2n);
    expect(organizationsService.update).toHaveBeenCalledWith(2n, updateDto);
    expect(organizationsService.removeForUser).toHaveBeenCalledWith(7n, 2n);
    expect(created.deletedAt).toBeUndefined();
    expect(list[0].deletedAt).toBeUndefined();
    expect(one.slug).toBe('acme');
    expect(updated.name).toBe('Acme');
    expect(removed.id).toBe(2n);
  });

  it('rejects malformed ids before hitting service', async () => {
    await expect(controller.findOne('abc')).rejects.toThrow();

    expect(organizationsService.findOne).not.toHaveBeenCalled();
  });
});
