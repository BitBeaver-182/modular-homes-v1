import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  const authService = {
    registerUser: jest.fn(),
    login: jest.fn(),
    issueTokenForCredentials: jest.fn(),
    getSession: jest.fn(),
  };

  let controller: AuthController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new AuthController(authService as unknown as AuthService);
  });

  it('issues a token for the requested credentials', async () => {
    authService.issueTokenForCredentials.mockResolvedValue({
      access_token: 'token-value',
    });

    await expect(
      controller.createToken({
        email: 'owner@example.com',
        password: 'password-123',
      }),
    ).resolves.toEqual({
      access_token: 'token-value',
    });

    expect(authService.issueTokenForCredentials).toHaveBeenCalledWith({
      email: 'owner@example.com',
      password: 'password-123',
    });
  });

  it('registers a user and returns the token payload', async () => {
    authService.registerUser.mockResolvedValue({
      access_token: 'token-value',
      user: {
        id: '7',
        email: 'owner@example.com',
        name: 'Owner',
        avatarUrl: null,
      },
    });

    await expect(
      controller.register({
        email: 'owner@example.com',
        password: 'password-123',
        name: 'Owner',
      }),
    ).resolves.toEqual({
      access_token: 'token-value',
      user: {
        id: '7',
        email: 'owner@example.com',
        name: 'Owner',
        avatarUrl: null,
      },
    });
  });

  it('logs in a user and returns the token payload', async () => {
    authService.login.mockResolvedValue({
      access_token: 'token-value',
      user: {
        id: '7',
        email: 'owner@example.com',
        name: 'Owner',
        avatarUrl: null,
      },
    });

    await expect(
      controller.login({
        email: 'owner@example.com',
        password: 'password-123',
      }),
    ).resolves.toEqual({
      access_token: 'token-value',
      user: {
        id: '7',
        email: 'owner@example.com',
        name: 'Owner',
        avatarUrl: null,
      },
    });
  });

  it('returns the current actor payload', () => {
    expect(controller.me({ userId: 7n, email: 'owner@example.com' })).toEqual({
      userId: '7',
      email: 'owner@example.com',
    });
  });

  it('returns the current session payload', async () => {
    authService.getSession.mockResolvedValue({
      user: {
        id: '7',
        email: 'owner@example.com',
        name: 'Owner',
        avatarUrl: null,
      },
      memberships: [],
    });

    await expect(
      controller.session({ userId: 7n, email: 'owner@example.com' }),
    ).resolves.toEqual({
      user: {
        id: '7',
        email: 'owner@example.com',
        name: 'Owner',
        avatarUrl: null,
      },
      memberships: [],
    });
  });
});
