import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { envSchema } from './validation';

describe('Config validation — CACHE_TTL', () => {
  let module: TestingModule;

  beforeAll(async () => {
    // Set required env vars so schema validation passes
    process.env.DB_HOST = 'localhost';
    process.env.DB_NAME = 'test';
    process.env.DB_USER = 'test';
    process.env.DB_PASSWORD = 'test';
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
    process.env.DB_HOST = 'localhost';
    process.env.DB_NAME = 'test';
    process.env.DB_USER = 'test';
    process.env.DB_PASSWORD = 'test';
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
