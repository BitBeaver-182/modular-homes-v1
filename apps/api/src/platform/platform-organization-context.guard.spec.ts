import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PlatformOrganizationContextGuard } from './platform-organization-context.guard';

describe('PlatformOrganizationContextGuard', () => {
  const prisma = {
    organization: {
      findFirst: jest.fn(),
    },
  };

  let guard: PlatformOrganizationContextGuard;

  beforeEach(() => {
    jest.resetAllMocks();
    guard = new PlatformOrganizationContextGuard(prisma as never);
  });

  function createContext(headers: Record<string, unknown>) {
    const request = { headers } as Record<string, unknown>;

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      request,
    };
  }

  it('requires the x-organization-id header', async () => {
    const context = createContext({});

    await expect(guard.canActivate(context as never)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects malformed organization ids', async () => {
    const context = createContext({ 'x-organization-id': 'abc' });

    await expect(guard.canActivate(context as never)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects missing organizations', async () => {
    prisma.organization.findFirst.mockResolvedValue(null);
    const context = createContext({ 'x-organization-id': '4' });

    await expect(guard.canActivate(context as never)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('stores the parsed organization id on the request', async () => {
    prisma.organization.findFirst.mockResolvedValue({ id: 4n });
    const context = createContext({ 'x-organization-id': '4' });

    await expect(guard.canActivate(context as never)).resolves.toBe(true);
    expect(context.request.organizationId).toBe(4n);
  });
});
