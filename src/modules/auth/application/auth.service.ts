import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AuthSessionRecord,
  AuthUser,
  CookiePayload,
} from '../domain/auth.types';
import { AuthSessionStore } from '../infrastructure/auth-session.store';
import { KeycloakClientService } from '../infrastructure/keycloak-client.service';

type CallbackResult = {
  cookie: CookiePayload;
  redirectUrl: string;
  user: AuthUser;
};

type LogoutResult = {
  cookie: CookiePayload;
  redirectUrl: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly keycloakClient: KeycloakClientService,
    private readonly sessionStore: AuthSessionStore,
    private readonly config: ConfigService,
  ) {}

  async login(): Promise<{ redirectUrl: string }> {
    const state = await this.sessionStore.createLoginState();
    const redirectUrl = await this.keycloakClient.buildAuthorizationUrl(state);
    return { redirectUrl };
  }

  async callback(
    code: string | undefined,
    state: string | undefined,
  ): Promise<CallbackResult> {
    if (!code || !state) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son válidos',
        details: [
          {
            field: !code ? 'code' : 'state',
            message: 'El campo es obligatorio',
          },
        ],
      });
    }

    const validState = await this.sessionStore.consumeLoginState(state);
    if (!validState) {
      throw new UnauthorizedException('Estado de autenticación inválido');
    }

    const tokenResponse = await this.keycloakClient.exchangeCode(code);
    const userInfo = await this.keycloakClient.fetchUserInfo(
      tokenResponse.access_token,
    );
    const user = this.mapUser(userInfo, tokenResponse.access_token);

    const sessionRecord: AuthSessionRecord = {
      user,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      idToken: tokenResponse.id_token,
      createdAt: Date.now(),
      expiresAt: Date.now() + tokenResponse.expires_in * 1000,
    };

    const storedSession = await this.sessionStore.createSession(sessionRecord);

    return {
      cookie: this.sessionStore.buildSessionCookie(storedSession.sessionId),
      redirectUrl: this.frontendUrl(),
      user,
    };
  }

  async me(cookieValue: string | undefined): Promise<AuthUser> {
    const session = await this.sessionStore.getSessionFromCookie(cookieValue);
    if (!session) {
      throw new UnauthorizedException('Sesión no válida o expirada');
    }

    return session.user;
  }

  async logout(cookieValue: string | undefined): Promise<LogoutResult> {
    const session = await this.sessionStore.getSessionFromCookie(cookieValue);
    if (session) {
      await this.sessionStore.deleteSession(cookieValue);
    }

    const redirectUrl = session?.idToken
      ? await this.keycloakClient.buildLogoutUrl(session.idToken)
      : this.frontendUrl();

    return {
      cookie: this.sessionStore.buildClearCookie(),
      redirectUrl,
    };
  }

  private frontendUrl(): string {
    const value = this.config.get<string>('FRONTEND_INFRAESTRUCTURA_URL');
    if (!value) {
      throw new Error('FRONTEND_INFRAESTRUCTURA_URL is required');
    }
    return value;
  }

  private mapUser(
    userInfo: Record<string, unknown>,
    accessToken: string,
  ): AuthUser {
    const payload = this.decodeJwtPayload(accessToken);
    const clientId = this.config.get<string>('KEYCLOAK_CLIENT_ID') ?? '';

    const realmRoles = this.extractStringArray(
      (payload.realm_access as { roles?: unknown } | undefined)?.roles,
    );
    const clientRoles = this.extractStringArray(
      (
        payload.resource_access as
          | Record<string, { roles?: unknown }>
          | undefined
      )?.[clientId]?.roles,
    );

    const roles = [...new Set([...realmRoles, ...clientRoles])];

    return {
      sub: String(userInfo.sub ?? payload.sub ?? ''),
      name: String(
        userInfo.name ??
          payload.name ??
          userInfo.preferred_username ??
          'Usuario',
      ),
      email: this.optionalString(userInfo.email ?? payload.email),
      preferred_username: this.optionalString(
        userInfo.preferred_username ?? payload.preferred_username,
      ),
      given_name: this.optionalString(
        userInfo.given_name ?? payload.given_name,
      ),
      family_name: this.optionalString(
        userInfo.family_name ?? payload.family_name,
      ),
      picture: this.optionalString(userInfo.picture ?? payload.picture),
      roles,
    };
  }

  private decodeJwtPayload(token: string): Record<string, unknown> {
    const parts = token.split('.');
    if (parts.length < 2) {
      return {};
    }

    const raw = Buffer.from(parts[1], 'base64url').toString('utf8');
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  private extractStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((item): item is string => typeof item === 'string');
  }

  private optionalString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value : undefined;
  }
}
