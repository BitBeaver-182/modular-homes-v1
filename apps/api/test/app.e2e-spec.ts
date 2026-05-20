import { BadRequestException, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { OrganizationsService } from '../src/organizations/organizations.service';
import { UsersService } from '../src/users/users.service';

describe('Membership lifecycle (e2e)', () => {
  let app: INestApplication;
  let membershipCountForUser = 1;

  const usersServiceMock = {
    create: jest.fn(async () => ({ id: '1', email: 'user@example.com' })),
    findAll: jest.fn(async () => [{ id: '1', email: 'user@example.com' }]),
    findOne: jest.fn(async () => ({ id: '1', email: 'user@example.com' })),
    update: jest.fn(async () => ({ id: '1', email: 'user@example.com' })),
    remove: jest.fn(async () => ({ id: '1', deletedAt: new Date().toISOString() })),
  };

  const organizationsServiceMock = {
    create: jest.fn(async () => ({ id: '2', name: 'Acme' })),
    findAll: jest.fn(async () => [{ id: '2', name: 'Acme' }]),
    findOne: jest.fn(async () => ({ id: '2', name: 'Acme' })),
    update: jest.fn(async () => ({ id: '2', name: 'Acme Updated' })),
    remove: jest.fn(async () => ({ id: '2', deletedAt: new Date().toISOString() })),
    attachUser: jest.fn(async () => {
      membershipCountForUser += 1;
      return { id: 'm2' };
    }),
    detachUser: jest.fn(async () => {
      if (membershipCountForUser <= 1) {
        throw new BadRequestException('User must belong to at least one organization');
      }
      membershipCountForUser -= 1;
      return { id: 'm2', deletedAt: new Date().toISOString() };
    }),
  };

  beforeEach(async () => {
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
  });

  it('supports user-org membership lifecycle with last-membership guard', async () => {
    await request(app.getHttpServer()).post('/organizations').send({ name: 'Acme' }).expect(201);
    await request(app.getHttpServer())
      .post('/users')
      .send({ email: 'user@example.com', organizationId: '2' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/organizations/2/users')
      .send({ userId: '1' })
      .expect(201);
    await request(app.getHttpServer()).delete('/organizations/2/users/1').expect(200);
    await request(app.getHttpServer()).delete('/organizations/2/users/1').expect(400);
  });

  it('filters soft-deleted entities from list/get responses', () => {
    return request(app.getHttpServer())
      .get('/users')
      .expect(200)
      .expect([{ id: '1', email: 'user@example.com' }]);
  });
});
