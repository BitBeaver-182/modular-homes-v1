import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';

jest.mock('argon2', () => ({
  argon2id: 2,
  hash: jest.fn(),
  verify: jest.fn(),
}));

describe('AuthService', () => {
  const prisma = {
    user: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
  };
  const jwtService = {
    sign: jest.fn(),
  };

  let service: AuthService;
  const mockedArgon2 = jest.mocked(argon2);

  beforeEach(() => {
    jest.resetAllMocks();
    mockedArgon2.hash.mockResolvedValue('hashed-password');
    service = new AuthService(prisma as never, jwtService as never);
  });

  it('registers a new user and issues a token', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 7n,
      email: 'owner@example.com',
      name: 'Owner',
      avatarUrl: null,
    });
    jwtService.sign.mockReturnValue('signed-token');

    await expect(
      service.registerUser({
        email: 'owner@example.com',
        password: 'password-123',
        name: 'Owner',
      }),
    ).resolves.toEqual({
      access_token: 'signed-token',
      user: {
        id: '7',
        email: 'owner@example.com',
        name: 'Owner',
        avatarUrl: null,
      },
    });
  });

  it('rejects duplicate active user registration', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 7n,
      email: 'owner@example.com',
      deletedAt: null,
    });

    await expect(
      service.registerUser({
        email: 'owner@example.com',
        password: 'password-123',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('stores a password hash when registering', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 7n,
      email: 'owner@example.com',
      name: 'Owner',
      avatarUrl: null,
    });
    jwtService.sign.mockReturnValue('signed-token');

    await service.registerUser({
      email: 'owner@example.com',
      password: 'password-123',
      name: 'Owner',
    });

    expect(mockedArgon2.hash).toHaveBeenCalledWith(
      'password-123',
      expect.objectContaining({
        type: argon2.argon2id,
      }),
    );
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'owner@example.com',
        passwordHash: 'hashed-password',
        name: 'Owner',
        avatarUrl: undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
      },
    });
  });

  it('logs in an existing active user with valid credentials', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 7n,
      email: 'owner@example.com',
      name: 'Owner',
      avatarUrl: null,
      passwordHash: 'hashed-password',
    });
    mockedArgon2.verify.mockResolvedValue(true);
    jwtService.sign.mockReturnValue('signed-token');

    await expect(
      service.login({
        email: 'owner@example.com',
        password: 'password-123',
      }),
    ).resolves.toEqual({
      access_token: 'signed-token',
      user: {
        id: '7',
        email: 'owner@example.com',
        name: 'Owner',
        avatarUrl: null,
      },
    });

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        email: 'owner@example.com',
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        passwordHash: true,
      },
    });
    expect(mockedArgon2.verify).toHaveBeenCalledWith(
      'hashed-password',
      'password-123',
    );
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: '7',
      email: 'owner@example.com',
    });
  });

  it('throws when the user does not exist', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      service.login({
        email: 'missing@example.com',
        password: 'password-123',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws when the password does not match', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 7n,
      email: 'owner@example.com',
      name: 'Owner',
      avatarUrl: null,
      passwordHash: 'hashed-password',
    });
    mockedArgon2.verify.mockResolvedValue(false);

    await expect(
      service.login({
        email: 'owner@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects email-only token issuance', async () => {
    await expect(
      service.issueTokenForCredentials({
        email: 'owner@example.com',
      } as never),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns the current session with active memberships', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 7n,
      email: 'owner@example.com',
      name: 'Owner',
      avatarUrl: null,
      organizationUsers: [
        {
          id: 11n,
          governanceRole: 'owner',
          organization: {
            id: 2n,
            name: 'Acme',
            slug: 'acme',
            deletedAt: null,
          },
        },
      ],
    });

    await expect(
      service.getSession({
        userId: 7n,
        email: 'owner@example.com',
      }),
    ).resolves.toEqual({
      user: {
        id: '7',
        email: 'owner@example.com',
        name: 'Owner',
        avatarUrl: null,
      },
      memberships: [
        {
          id: '11',
          governanceRole: 'owner',
          organization: {
            id: '2',
            name: 'Acme',
            slug: 'acme',
          },
        },
      ],
    });
  });
});
