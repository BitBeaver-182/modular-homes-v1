import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { PlatformMembershipGuard } from '../platform/platform-membership.guard';
import { PlatformOrganizationContextGuard } from '../platform/platform-organization-context.guard';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

describe('UploadsController', () => {
  const uploadsService = {
    presign: jest.fn(),
    confirm: jest.fn(),
    remove: jest.fn(),
    getSignedUrl: jest.fn(),
  };
  const actor = {
    userId: 9n,
    email: 'owner@example.com',
    organizationId: 4n,
    governanceRole: 'owner' as const,
  };

  let controller: UploadsController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new UploadsController(
      uploadsService as unknown as UploadsService,
    );
  });

  it('requires JWT, organization context, and membership guards', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, UploadsController)).toEqual([
      JwtGuard,
      PlatformOrganizationContextGuard,
      PlatformMembershipGuard,
    ]);
  });

  it('routes upload operations through the trusted actor', async () => {
    uploadsService.presign.mockResolvedValue({
      fileId: 'file_123',
      uploadUrl: 'https://uploads.example.com/signed',
      expiresIn: 300,
    });
    uploadsService.confirm.mockResolvedValue({
      id: 'file_123',
      filename: 'floor-plan.pdf',
      mimeType: 'application/pdf',
      url: 'https://uploads.example.com/read',
      context: 'SUPPLIER_DOCUMENT',
      status: 'CONFIRMED',
      uploadedAt: '2026-05-30T08:00:00.000Z',
    });
    uploadsService.getSignedUrl.mockResolvedValue(
      'https://uploads.example.com/read',
    );

    await expect(
      controller.presign(actor, {
        filename: 'floor-plan.pdf',
        mimeType: 'application/pdf',
        context: 'SUPPLIER_DOCUMENT',
      }),
    ).resolves.toMatchObject({
      fileId: 'file_123',
      uploadUrl: 'https://uploads.example.com/signed',
      expiresIn: 300,
    });
    await expect(
      controller.confirm(actor, { fileId: 'file_123' }),
    ).resolves.toMatchObject({
      id: 'file_123',
      context: 'SUPPLIER_DOCUMENT',
      status: 'CONFIRMED',
    });
    await expect(
      controller.getSignedUrl(actor, { fileId: 'file_123' }),
    ).resolves.toMatchObject({
      url: 'https://uploads.example.com/read',
    });
    await expect(controller.remove(actor, { fileId: 'file_123' })).resolves.toBe(
      undefined,
    );

    expect(uploadsService.presign).toHaveBeenCalledWith(
      {
        filename: 'floor-plan.pdf',
        mimeType: 'application/pdf',
        context: 'SUPPLIER_DOCUMENT',
      },
      actor,
    );
    expect(uploadsService.confirm).toHaveBeenCalledWith('file_123', actor);
    expect(uploadsService.remove).toHaveBeenCalledWith('file_123', actor);
    expect(uploadsService.getSignedUrl).toHaveBeenCalledWith('file_123', actor);
  });
});
