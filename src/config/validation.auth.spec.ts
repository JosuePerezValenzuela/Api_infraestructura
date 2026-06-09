import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { envSchema } from './validation';

describe('Config validation — auth/session defaults', () => {
  let module: TestingModule;

  beforeAll(async () => {
    process.env.API_BASE_URL = 'http://localhost:3002';
    process.env.CORS_ORIGINS = 'http://localhost:8000';
    process.env.FRONTEND_INFRAESTRUCTURA_URL = 'http://localhost:8000';
    process.env.KEYCLOAK_FRONTEND_URL = 'http://sso.umss.edu.bo';
    process.env.KEYCLOAK_CLIENT_ID = 'siss';
    process.env.KEYCLOAK_SERVER_ISSUER = 'http://sso.umss.edu.bo:8443/realms/umss';
    process.env.KEYCLOAK_CLIENT_SECRET = 'secret';
    process.env.DB_HOST = 'localhost';
    process.env.DB_NAME = 'test';
    process.env.DB_USER = 'test';
    process.env.DB_PASSWORD = 'test';
    process.env.SESSION_SECRET = '01234567890123456789012345678901';
    delete process.env.SESSION_COOKIE_NAME;
    delete process.env.SESSION_COOKIE_DOMAIN;
    delete process.env.SESSION_COOKIE_SAMESITE;
    delete process.env.SESSION_COOKIE_SECURE;
    delete process.env.SESSION_TTL_SECONDS;

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          ignoreEnvFile: true,
          validationSchema: envSchema,
        }),
      ],
    }).compile();
  });

  it('defaults the auth session settings', () => {
    const config = module.get(ConfigService);
    expect(config.get<string>('SESSION_COOKIE_NAME')).toBe('siss_session');
    expect(config.get<string>('SESSION_COOKIE_DOMAIN')).toBe('');
    expect(config.get<string>('SESSION_COOKIE_SAMESITE')).toBe('lax');
    expect(config.get<boolean>('SESSION_COOKIE_SECURE')).toBe(false);
    expect(config.get<number>('SESSION_TTL_SECONDS')).toBe(3600);
  });
});
