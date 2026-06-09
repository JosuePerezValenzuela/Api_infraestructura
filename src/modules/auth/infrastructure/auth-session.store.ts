import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { AuthSessionRecord, CookiePayload } from '../domain/auth.types';

type StoredSession = AuthSessionRecord & { sessionId: string };

@Injectable()
export class AuthSessionStore {
  private readonly redis: Redis;

  constructor(private readonly config: ConfigService) {
    this.redis = new Redis({
      host: this.config.get<string>('REDIS_HOST'),
      port: this.config.get<number>('REDIS_PORT'),
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
      lazyConnect: true,
    });
  }

  async createLoginState(): Promise<string> {
    const state = randomUUID();
    await this.redis.set(this.stateKey(state), '1', 'EX', 600);
    return state;
  }

  async consumeLoginState(state: string): Promise<boolean> {
    const key = this.stateKey(state);
    const exists = await this.redis.get(key);
    if (!exists) {
      return false;
    }

    await this.redis.del(key);
    return true;
  }

  async createSession(record: AuthSessionRecord): Promise<StoredSession> {
    const sessionId = randomUUID();
    await this.saveSession(sessionId, record);

    return {
      ...record,
      sessionId,
    };
  }

  async saveSession(sessionId: string, record: AuthSessionRecord): Promise<void> {
    await this.redis.set(
      this.sessionKey(sessionId),
      JSON.stringify(record),
      'EX',
      this.sessionTtlSeconds(),
    );
  }

  async getSessionFromCookie(
    cookieValue: string | undefined,
  ): Promise<StoredSession | null> {
    const sessionId = this.extractSessionId(cookieValue);
    if (!sessionId) {
      return null;
    }

    const raw = await this.redis.get(this.sessionKey(sessionId));
    if (!raw) {
      return null;
    }

    const session = JSON.parse(raw) as AuthSessionRecord;
    return {
      ...session,
      sessionId,
    };
  }

  async deleteSession(cookieValue: string | undefined): Promise<void> {
    const sessionId = this.extractSessionId(cookieValue);
    if (!sessionId) {
      return;
    }

    await this.redis.del(this.sessionKey(sessionId));
  }

  async deleteSessionById(sessionId: string): Promise<void> {
    await this.redis.del(this.sessionKey(sessionId));
  }

  buildSessionCookie(sessionId: string): CookiePayload {
    return {
      name: this.cookieName(),
      value: this.signSessionId(sessionId),
      options: this.cookieOptions(this.sessionTtlSeconds() * 1000),
    };
  }

  buildClearCookie(): CookiePayload {
    return {
      name: this.cookieName(),
      value: '',
      options: {
        ...this.cookieOptions(0),
        maxAge: 0,
      },
    };
  }

  extractSessionId(cookieValue: string | undefined): string | null {
    if (!cookieValue) {
      return null;
    }

    const [sessionId, signature] = cookieValue.split('.');
    if (!sessionId || !signature) {
      return null;
    }

    const expectedSignature = this.signSessionId(sessionId).split('.')[1];
    if (!expectedSignature) {
      return null;
    }

    const left = Buffer.from(signature);
    const right = Buffer.from(expectedSignature);
    if (left.length !== right.length) {
      return null;
    }

    if (!timingSafeEqual(left, right)) {
      return null;
    }

    return sessionId;
  }

  private cookieName(): string {
    return this.config.get<string>('SESSION_COOKIE_NAME') ?? 'siss_session';
  }

  private cookieOptions(maxAge: number) {
    const domain = this.config.get<string>('SESSION_COOKIE_DOMAIN') ?? '';
    const sameSite = (this.config.get<string>('SESSION_COOKIE_SAMESITE') ??
      'lax') as 'lax' | 'strict' | 'none';

    return {
      domain: domain.trim() ? domain.trim() : undefined,
      httpOnly: true,
      maxAge,
      path: '/',
      sameSite,
      secure: this.config.get<boolean>('SESSION_COOKIE_SECURE') ?? false,
    };
  }

  private sessionTtlSeconds(): number {
    return this.config.get<number>('SESSION_TTL_SECONDS') ?? 3600;
  }

  private sessionKey(sessionId: string): string {
    return `auth:session:${sessionId}`;
  }

  private stateKey(state: string): string {
    return `auth:state:${state}`;
  }

  private signSessionId(sessionId: string): string {
    const secret = this.config.get<string>('SESSION_SECRET');
    if (!secret) {
      throw new Error('SESSION_SECRET is required');
    }

    const signature = createHmac('sha256', secret)
      .update(sessionId)
      .digest('base64url');

    return `${sessionId}.${signature}`;
  }
}
