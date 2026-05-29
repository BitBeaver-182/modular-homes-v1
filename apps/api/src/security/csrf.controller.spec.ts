import { Request, Response } from 'express';
import { CsrfController } from './csrf.controller';
import { CsrfProtectionService } from './csrf-protection.service';

describe('CsrfController', () => {
  it('returns a generated csrf token payload', () => {
    const csrfProtectionService = {
      generateToken: jest.fn().mockReturnValue('csrf-token'),
    };
    const controller = new CsrfController(
      csrfProtectionService as unknown as CsrfProtectionService,
    );
    const request = {} as Request;
    const response = {} as Response;

    expect(controller.issueToken(request, response)).toEqual({
      csrfToken: 'csrf-token',
    });
    expect(csrfProtectionService.generateToken).toHaveBeenCalledWith(
      request,
      response,
    );
  });
});
