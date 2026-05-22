import { NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const prisma = {
    user: {
      findFirst: jest.fn(),
    },
  };
  const jwtService = {
    sign: jest.fn(),
  };

  let service: AuthService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new AuthService(prisma as never, jwtService as never);
  });

  it('issues a token for an existing active user', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 7n,
      email: 'owner@example.com',
    });
    jwtService.sign.mockReturnValue('signed-token');

    await expect(
      service.issueTokenForEmail('owner@example.com'),
    ).resolves.toEqual({
      access_token: 'signed-token',
    });

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        email: 'owner@example.com',
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
      },
    });
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: '7',
      email: 'owner@example.com',
    });
  });

  it('throws when the user does not exist', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      service.issueTokenForEmail('missing@example.com'),
    ).rejects.toThrow(NotFoundException);
  });
});
