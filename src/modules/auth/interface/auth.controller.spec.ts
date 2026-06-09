import { AuthController } from './auth.controller';
import { AuthService } from '../application/auth.service';
import { ConfigService } from '@nestjs/config';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let config: jest.Mocked<ConfigService>;

  beforeEach(() => {
    authService = {
      login: jest.fn(),
      callback: jest.fn(),
      me: jest.fn(),
      logout: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    config = {
      get: jest.fn(() => 'siss_session'),
    } as unknown as jest.Mocked<ConfigService>;

    controller = new AuthController(authService, config);
  });

  it('redirects to Keycloak on login', async () => {
    const res = {
      redirect: jest.fn().mockReturnThis(),
    } as any;

    authService.login.mockResolvedValue({ redirectUrl: 'https://sso/login' });

    await controller.login(res);

    expect(res.redirect).toHaveBeenCalledWith(302, 'https://sso/login');
  });

  it('sets the cookie and redirects on callback', async () => {
    const res = {
      cookie: jest.fn(),
      redirect: jest.fn().mockReturnThis(),
    } as any;

    authService.callback.mockResolvedValue({
      redirectUrl: 'http://localhost:8000',
      user: {
        sub: '123',
        name: 'Ada Lovelace',
        roles: [],
      },
      cookie: {
        name: 'siss_session',
        value: 'cookie-value',
        options: {
          httpOnly: true,
          path: '/',
          sameSite: 'lax',
          secure: false,
        },
      },
    });

    await controller.callback({ code: 'code-1', state: 'state-1' } as any, res);

    expect(res.cookie).toHaveBeenCalledWith(
      'siss_session',
      'cookie-value',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.redirect).toHaveBeenCalledWith(302, 'http://localhost:8000');
  });
});
