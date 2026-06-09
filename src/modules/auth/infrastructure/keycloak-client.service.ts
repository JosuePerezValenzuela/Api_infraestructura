import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type DiscoveryDocument = {
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  end_session_endpoint?: string;
};

type TokenResponse = {
  access_token: string;
  expires_in: number;
  id_token?: string;
  refresh_token?: string;
  refresh_expires_in?: number;
  scope?: string;
  token_type: string;
};

@Injectable()
export class KeycloakClientService {
  private discoveryPromise?: Promise<DiscoveryDocument>;

  constructor(private readonly config: ConfigService) {}

  async buildAuthorizationUrl(state: string): Promise<string> {
    const discovery = await this.discovery();
    const url = new URL(discovery.authorization_endpoint);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', this.clientId());
    url.searchParams.set('redirect_uri', this.redirectUri());
    url.searchParams.set('scope', 'openid profile email');
    url.searchParams.set('state', state);
    return url.toString();
  }

  async exchangeCode(code: string): Promise<TokenResponse> {
    const discovery = await this.discovery();
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientId(),
      client_secret: this.clientSecret(),
      code,
      redirect_uri: this.redirectUri(),
    });

    const response = await fetch(discovery.token_endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body,
    });

    if (!response.ok) {
      throw new Error(
        `Keycloak token exchange failed with status ${response.status}`,
      );
    }

    return (await response.json()) as TokenResponse;
  }

  async refreshTokens(refreshToken: string): Promise<TokenResponse> {
    const discovery = await this.discovery();
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.clientId(),
      client_secret: this.clientSecret(),
      refresh_token: refreshToken,
    });

    const response = await fetch(discovery.token_endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body,
    });

    if (!response.ok) {
      throw new Error(
        `Keycloak refresh token failed with status ${response.status}`,
      );
    }

    return (await response.json()) as TokenResponse;
  }

  async fetchUserInfo(accessToken: string): Promise<Record<string, unknown>> {
    const discovery = await this.discovery();
    const response = await fetch(discovery.userinfo_endpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Keycloak userinfo failed with status ${response.status}`,
      );
    }

    return (await response.json()) as Record<string, unknown>;
  }

  async buildLogoutUrl(idTokenHint?: string): Promise<string> {
    const discovery = await this.discovery();
    const fallback = this.frontendUrl();

    if (!discovery.end_session_endpoint) {
      return fallback;
    }

    const url = new URL(discovery.end_session_endpoint);
    if (idTokenHint) {
      url.searchParams.set('id_token_hint', idTokenHint);
    }
    url.searchParams.set('post_logout_redirect_uri', fallback);
    url.searchParams.set('client_id', this.clientId());
    return url.toString();
  }

  private async discovery(): Promise<DiscoveryDocument> {
    if (!this.discoveryPromise) {
      const wellKnownUrl = `${this.issuer().replace(/\/$/, '')}/.well-known/openid-configuration`;
      this.discoveryPromise = fetch(wellKnownUrl, {
        headers: { Accept: 'application/json' },
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error(
            `Keycloak discovery failed with status ${response.status}`,
          );
        }
        return (await response.json()) as DiscoveryDocument;
      });
    }

    return this.discoveryPromise;
  }

  private clientId(): string {
    const value = this.config.get<string>('KEYCLOAK_CLIENT_ID');
    if (!value) {
      throw new Error('KEYCLOAK_CLIENT_ID is required');
    }
    return value;
  }

  private clientSecret(): string {
    const value = this.config.get<string>('KEYCLOAK_CLIENT_SECRET');
    if (!value) {
      throw new Error('KEYCLOAK_CLIENT_SECRET is required');
    }
    return value;
  }

  private issuer(): string {
    const value = this.config.get<string>('KEYCLOAK_SERVER_ISSUER');
    if (!value) {
      throw new Error('KEYCLOAK_SERVER_ISSUER is required');
    }
    return value;
  }

  private redirectUri(): string {
    const baseUrl = this.config.get<string>('API_BASE_URL');
    const prefix = this.config.get<string>('GLOBAL_PREFIX') ?? 'api';
    if (!baseUrl) {
      throw new Error('API_BASE_URL is required');
    }
    return `${baseUrl.replace(/\/$/, '')}/${prefix}/auth/callback`;
  }

  private frontendUrl(): string {
    const value = this.config.get<string>('FRONTEND_INFRAESTRUCTURA_URL');
    if (!value) {
      throw new Error('FRONTEND_INFRAESTRUCTURA_URL is required');
    }
    return value;
  }
}
