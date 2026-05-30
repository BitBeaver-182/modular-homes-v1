import { ForbiddenException } from '@nestjs/common';
import { PlatformMembershipGuard } from './platform-membership.guard';

describe('PlatformMembershipGuard', () => {
  const prisma = {
    organizationUser: {
      findFirst: jest.fn(),
    },
  };

  let guard: PlatformMembershipGuard;

  beforeEach(() => {
    jest.resetAllMocks();
    guard = new PlatformMembershipGuard(prisma as never);
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
      request,
    };
  }

  it('rejects requests without active organization membership', async () => {
    prisma.organizationUser.findFirst.mockResolvedValue(null);

    await expect(guard.canActivate(createContext() as never)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('attaches the trusted actor from active membership', async () => {
    prisma.organizationUser.findFirst.mockResolvedValue({
      governanceRole: 'owner',
    });
    const context = createContext();

    await expect(guard.canActivate(context as never)).resolves.toBe(true);

    expect(prisma.organizationUser.findFirst).toHaveBeenCalledWith({
      where: {
        organizationId: 4n,
        userId: 9n,
        deletedAt: null,
        status: 'active',
      },
      select: { governanceRole: true },
    });
    expect(context.request.actor).toEqual({
      userId: 9n,
      email: 'owner@example.com',
      organizationId: 4n,
      governanceRole: 'owner',
    });
  });
});
