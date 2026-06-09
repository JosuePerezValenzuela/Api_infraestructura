import * as Joi from 'joi';

export const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  API_BASE_URL: Joi.string().required(),
  CORS_ORIGINS: Joi.string().required(),

  FRONTEND_INFRAESTRUCTURA_URL: Joi.string().required(),

  KEYCLOAK_FRONTEND_URL: Joi.string().required(),
  KEYCLOAK_CLIENT_ID: Joi.string().required(),
  KEYCLOAK_SERVER_ISSUER: Joi.string().required(),
  KEYCLOAK_CLIENT_SECRET: Joi.string().required(),

  // Base de datos
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),

  // JWT
  GLOBAL_PREFIX: Joi.string().default('api'),

  SESSION_SECRET: Joi.string().min(32).required(),
  SESSION_COOKIE_NAME: Joi.string().default('siss_session'),
  SESSION_COOKIE_DOMAIN: Joi.string().allow('').default(''),
  SESSION_COOKIE_SAMESITE: Joi.string()
    .valid('lax', 'strict', 'none')
    .default('lax'),
  SESSION_COOKIE_SECURE: Joi.boolean().default(false),
  SESSION_TTL_SECONDS: Joi.number().default(3600),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  CACHE_TTL: Joi.number().default(300),
});
