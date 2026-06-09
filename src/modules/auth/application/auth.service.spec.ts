import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthSessionStore } from '../infrastructure/auth-session.store';
import { KeycloakClientService } from '../infrastructure/keycloak-client.service';

describe('AuthService', () => {
  let service: AuthService;
  let keycloakClient: jest.Mocked<KeycloakClientService>;
  let sessionStore: jest.Mocked<AuthSessionStore>;
  let config: jest.Mocked<ConfigService>;

  beforeEach(() => {
    keycloakClient = {
      buildAuthorizationUrl: jest.fn(),
      exchangeCode: jest.fn(),
      fetchUserInfo: jest.fn(),
      buildLogoutUrl: jest.fn(),
      refreshTokens: jest.fn(),
    } as unknown as jest.Mocked<KeycloakClientService>;

    sessionStore = {
      createLoginState: jest.fn(),
      consumeLoginState: jest.fn(),
      createSession: jest.fn(),
      saveSession: jest.fn(),
      getSessionFromCookie: jest.fn(),
      deleteSession: jest.fn(),
      deleteSessionById: jest.fn(),
      buildSessionCookie: jest.fn(),
      buildClearCookie: jest.fn(),
    } as unknown as jest.Mocked<AuthSessionStore>;

    config = {
      get: jest.fn((key: string) => {
        if (key === 'FRONTEND_INFRAESTRUCTURA_URL')
          return 'http://localhost:8000';
        if (key === 'KEYCLOAK_CLIENT_ID') return 'siss';
        return undefined;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    service = new AuthService(keycloakClient, sessionStore, config);
  });

  const makeJwt = (payload: Record<string, unknown>) => {
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString(
      'base64url',
    );
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `${header}.${body}.signature`;
  };

  it('builds the login redirect URL', async () => {
    sessionStore.createLoginState.mockResolvedValue('state-1');
    keycloakClient.buildAuthorizationUrl.mockResolvedValue(
      'https://sso/login?state=state-1',
    );

    await expect(service.login()).resolves.toEqual({
      redirectUrl: 'https://sso/login?state=state-1',
    });

    expect(sessionStore.createLoginState).toHaveBeenCalledTimes(1);
  });

  it('creates a session after the callback', async () => {
    sessionStore.consumeLoginState.mockResolvedValue(true);
    keycloakClient.exchangeCode.mockResolvedValue({
      access_token: 'access.header.sig',
      expires_in: 3600,
      id_token: makeJwt({
        sub: '123',
        name: 'Ada Lovelace',
        email: 'ada@umss.edu.bo',
        preferred_username: 'ada',
      }),
      refresh_token: 'refresh-token',
      token_type: 'Bearer',
    });
    sessionStore.createSession.mockResolvedValue({
      sessionId: 'session-1',
      user: {
        sub: '123',
        name: 'Ada Lovelace',
        email: 'ada@umss.edu.bo',
        preferred_username: 'ada',
        roles: [],
      },
      accessToken: 'access.header.sig',
      refreshToken: 'refresh-token',
      idToken: makeJwt({
        sub: '123',
        name: 'Ada Lovelace',
        email: 'ada@umss.edu.bo',
        preferred_username: 'ada',
      }),
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    });
    sessionStore.buildSessionCookie.mockReturnValue({
      name: 'siss_session',
      value: 'session-1.signature',
      options: {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: false,
      },
    });

    const result = await service.callback('code-1', 'state-1');

    expect(result.redirectUrl).toBe('http://localhost:8000');
    expect(result.cookie.value).toBe('session-1.signature');
    expect(result.user.name).toBe('Ada Lovelace');
    expect(keycloakClient.fetchUserInfo).not.toHaveBeenCalled();
  });

  it('rejects callback with invalid state', async () => {
    sessionStore.consumeLoginState.mockResolvedValue(false);

    await expect(
      service.callback('code-1', 'bad-state'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns the authenticated user from the session', async () => {
    sessionStore.getSessionFromCookie.mockResolvedValue({
      sessionId: 'session-1',
      user: {
        sub: '123',
        name: 'Ada Lovelace',
        roles: ['admin'],
      },
      accessToken: 'token',
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    });

    await expect(service.me('session-1.signature')).resolves.toEqual({
      sub: '123',
      name: 'Ada Lovelace',
      roles: ['admin'],
    });
  });

  it('throws when there is no valid session', async () => {
    sessionStore.getSessionFromCookie.mockResolvedValue(null);

    await expect(service.me(undefined)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('logs out locally and redirects to frontend when no id token exists', async () => {
    sessionStore.getSessionFromCookie.mockResolvedValue({
      sessionId: 'session-1',
      user: {
        sub: '123',
        name: 'Ada Lovelace',
        roles: [],
      },
      accessToken: 'token',
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    });
    sessionStore.buildClearCookie.mockReturnValue({
      name: 'siss_session',
      value: '',
      options: {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: false,
      },
    });

    await expect(service.logout('session-1.signature')).resolves.toEqual({
      cookie: {
        name: 'siss_session',
        value: '',
        options: {
          httpOnly: true,
          path: '/',
          sameSite: 'lax',
          secure: false,
        },
      },
      redirectUrl: 'http://localhost:8000',
    });

    expect(sessionStore.deleteSession).toHaveBeenCalledWith(
      'session-1.signature',
    );
  });

  it('refreshes the session lazily when the access token is about to expire', async () => {
    const expiresSoon = Date.now() + 30 * 1000;
    sessionStore.getSessionFromCookie.mockResolvedValue({
      sessionId: 'session-1',
      user: {
        sub: '123',
        name: 'Ada Lovelace',
        roles: ['admin'],
      },
      accessToken: 'old-access',
      refreshToken: 'old-refresh',
      idToken: 'old-id',
      createdAt: Date.now() - 1000,
      expiresAt: expiresSoon,
    });
    keycloakClient.refreshTokens.mockResolvedValue({
      access_token: 'new-access',
      expires_in: 3600,
      id_token: 'new-id',
      refresh_token: 'new-refresh',
      refresh_expires_in: 7200,
      token_type: 'Bearer',
    });

    await expect(service.me('session-1.signature')).resolves.toEqual({
      sub: '123',
      name: 'Ada Lovelace',
      roles: ['admin'],
    });

    expect(keycloakClient.refreshTokens).toHaveBeenCalledWith('old-refresh');
    expect(sessionStore.saveSession).toHaveBeenCalledWith(
      'session-1',
      expect.objectContaining({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        idToken: 'new-id',
      }),
    );
  });

  it('clears the local session if refresh fails', async () => {
    sessionStore.getSessionFromCookie.mockResolvedValue({
      sessionId: 'session-1',
      user: {
        sub: '123',
        name: 'Ada Lovelace',
        roles: ['admin'],
      },
      accessToken: 'old-access',
      refreshToken: 'old-refresh',
      createdAt: Date.now() - 1000,
      expiresAt: Date.now() + 10 * 1000,
    });
    keycloakClient.refreshTokens.mockRejectedValue(new Error('refresh failed'));

    await expect(service.me('session-1.signature')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(sessionStore.deleteSessionById).toHaveBeenCalledWith('session-1');
  });
});
