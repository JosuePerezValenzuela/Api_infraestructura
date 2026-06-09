import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { envSchema } from './validation';

describe('Config validation — CACHE_TTL', () => {
  let module: TestingModule;

  beforeAll(async () => {
    // Set required env vars so schema validation passes
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
    // Ensure CACHE_TTL is not set, so default is exercised
    delete process.env.CACHE_TTL;

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          ignoreEnvFile: true,
          validationSchema: envSchema,
        }),
      ],
    }).compile();
  });

  it('defaults CACHE_TTL to 300 when not set in environment', () => {
    const config = module.get(ConfigService);
    expect(config.get<number>('CACHE_TTL')).toBe(300);
  });
});

describe('Config validation — CACHE_TTL override', () => {
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
    process.env.CACHE_TTL = '600';

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          ignoreEnvFile: true,
          validationSchema: envSchema,
        }),
      ],
    }).compile();
  });

  it('uses the env var value when CACHE_TTL is set', () => {
    const config = module.get(ConfigService);
    expect(config.get<number>('CACHE_TTL')).toBe(600);
  });
});
