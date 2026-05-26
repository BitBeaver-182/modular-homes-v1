import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const configService = {
    jwtSecret: 'test-secret',
  };
  const prisma = {
    user: {
      findFirst: jest.fn(),
    },
  };

  let strategy: JwtStrategy;

  beforeEach(() => {
    jest.resetAllMocks();
    strategy = new JwtStrategy(configService as never, prisma as never);
  });

  it('validates an active user from the token payload', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 7n,
      email: 'owner@example.com',
    });

    await expect(
      strategy.validate({ sub: '7', email: 'owner@example.com' }),
    ).resolves.toEqual({
      userId: 7n,
      email: 'owner@example.com',
    });
  });

  it('rejects an invalid token payload', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      strategy.validate({ sub: '7', email: 'owner@example.com' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
