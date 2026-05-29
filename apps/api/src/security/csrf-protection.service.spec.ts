import { Request, Response } from 'express';
import { AppConfigService } from '../config/app-config.service';
import { CsrfProtectionService } from './csrf-protection.service';

describe('CsrfProtectionService', () => {
  const configService = {
    csrfSecret: 'csrf-secret',
    nodeEnv: 'test',
  } as AppConfigService;

  let service: CsrfProtectionService;

  beforeEach(() => {
    service = new CsrfProtectionService(configService);
  });

  it('skips csrf protection for bearer-token requests', () => {
    const next = jest.fn();
    const response = {
      headersSent: false,
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    service.middleware(
      {
        headers: {
          authorization: 'Bearer test-token',
        },
      } as Request,
      response,
      next,
    );

    expect(next).toHaveBeenCalledWith(undefined);
  });
});
