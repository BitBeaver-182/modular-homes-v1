import { ForbiddenException } from '@nestjs/common';
import { PlatformOwnerGuard } from './platform-owner.guard';

describe('PlatformOwnerGuard', () => {
  const prisma = {
    organizationUser: {
      findFirst: jest.fn(),
    },
  };

  let guard: PlatformOwnerGuard;

  beforeEach(() => {
    jest.resetAllMocks();
    guard = new PlatformOwnerGuard(prisma as never);
  });

  function createContext() {
    const request = {
      organizationId: 4n,
      user: {
        userId: 9n,
        email: 'owner@example.com',
      },
    } as Record<string, unknown>;

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    };
  }

  it('rejects requests from non-owners', async () => {
    prisma.organizationUser.findFirst.mockResolvedValue(null);

    await expect(guard.canActivate(createContext() as never)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('allows active owners in the scoped organization', async () => {
    prisma.organizationUser.findFirst.mockResolvedValue({ id: 1n });

    await expect(guard.canActivate(createContext() as never)).resolves.toBe(
      true,
    );
  });
});
