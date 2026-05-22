import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  const authService = {
    issueTokenForEmail: jest.fn(),
  };

  let controller: AuthController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new AuthController(authService as unknown as AuthService);
  });

  it('issues a token for the requested email', async () => {
    authService.issueTokenForEmail.mockResolvedValue({
      access_token: 'token-value',
    });

    await expect(
      controller.createToken({ email: 'owner@example.com' }),
    ).resolves.toEqual({
      access_token: 'token-value',
    });

    expect(authService.issueTokenForEmail).toHaveBeenCalledWith(
      'owner@example.com',
    );
  });

  it('returns the current actor payload', () => {
    expect(controller.me({ userId: 7n, email: 'owner@example.com' })).toEqual({
      userId: '7',
      email: 'owner@example.com',
    });
  });
});
