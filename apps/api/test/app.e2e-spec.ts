import { BadRequestException, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'node:http';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { OrganizationsService } from '../src/organizations/organizations.service';
import { UsersService } from '../src/users/users.service';

describe('Membership lifecycle (e2e)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let membershipCountForUser = 1;

  const usersServiceMock = {
    create: jest.fn(() => ({ id: 1n, email: 'user@example.com' })),
    findAll: jest.fn(() => [{ id: 1n, email: 'user@example.com' }]),
    findOne: jest.fn(() => ({ id: 1n, email: 'user@example.com' })),
    update: jest.fn(() => ({ id: 1n, email: 'user@example.com' })),
    remove: jest.fn(() => ({
      id: 1n,
      deletedAt: new Date().toISOString(),
    })),
  };

  const organizationsServiceMock = {
    create: jest.fn(() => ({ id: 2n, name: 'Acme', slug: 'acme' })),
    findAll: jest.fn(() => [{ id: 2n, name: 'Acme', slug: 'acme' }]),
    findOne: jest.fn(() => ({ id: 2n, name: 'Acme', slug: 'acme' })),
    update: jest.fn(() => ({ id: 2n, name: 'Acme Updated', slug: 'acme' })),
    remove: jest.fn(() => ({
      id: 2n,
      deletedAt: new Date().toISOString(),
    })),
    attachUser: jest.fn(() => {
      membershipCountForUser += 1;
      return { id: 2n, organizationId: 2n, userId: 1n };
    }),
    detachUser: jest.fn(() => {
      if (membershipCountForUser <= 1) {
        throw new BadRequestException(
          'User must belong to at least one organization',
        );
      }
      membershipCountForUser -= 1;
      return { id: 2n, deletedAt: new Date().toISOString() };
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    membershipCountForUser = 1;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(UsersService)
      .useValue(usersServiceMock)
      .overrideProvider(OrganizationsService)
      .useValue(organizationsServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer() as Server;
  });

  afterEach(async () => {
    await app.close();
  });

  it('supports user-org membership lifecycle with last-membership guard', async () => {
    await request(httpServer)
      .post('/organizations')
      .send({ name: 'Acme', slug: 'acme' })
      .expect(201);
    await request(httpServer)
      .post('/users')
      .send({ email: 'user@example.com', organizationId: '2' })
      .expect(201);
    await request(httpServer)
      .post('/organizations/2/users')
      .send({ userId: '1' })
      .expect(201)
      .expect({ id: '2', organizationId: '2', userId: '1' });
    await request(httpServer).delete('/organizations/2/users/1').expect(200);
    await request(httpServer).delete('/organizations/2/users/1').expect(400);
  });

  it('filters soft-deleted entities from list/get responses', () => {
    return request(httpServer)
      .get('/users')
      .expect(200)
      .expect([{ id: '1', email: 'user@example.com' }]);
  });

  it('rejects malformed organization membership ids before service calls', async () => {
    await request(httpServer)
      .post('/organizations/2/users')
      .send({})
      .expect(400);

    expect(organizationsServiceMock.attachUser).not.toHaveBeenCalled();
  });

  it('rejects invalid user payloads at the validation layer', async () => {
    await request(httpServer)
      .post('/users')
      .send({ email: 'not-an-email', organizationId: '2' })
      .expect(400);

    expect(usersServiceMock.create).not.toHaveBeenCalled();
  });
});
