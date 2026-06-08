# Tasks: Redis Cache — Tipo-Bloque Pilot

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~420–450 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

Cache deps (`@nestjs/cache-manager`, `cache-manager-ioredis`, `ioredis`) already in `package.json`. No install needed. `.env.example` already has `REDIS_HOST`/`REDIS_PORT` — only `CACHE_TTL` needs adding.

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Foundation + CacheService | Single PR | Base: main. Includes config, CacheKeyBuilder, CacheModule, CacheService + tests. Self-verifiable. |
| 2 | Use case integration | Single PR | Base: main (same PR as Unit 1 — single delivery). All 4 use cases + spec updates. |

## Phase 1: Foundation (Config + Key Builder + Module)

- [x] 1.1 **Config** — Add `CACHE_TTL` (Joi number default 300) to `src/config/validation.ts` and `CACHE_TTL=300` to `.env.example`. Test: `ConfigService.get('CACHE_TTL')` returns 300.

- [x] 1.2 **CacheKeyBuilder** — Create `src/modules/_shared/infrastructure/cache/cache-key-builder.ts` with `static list(resource, params)`. Sorted query-string format (e.g., `tipo_bloque:list:limit=6&page=1`). Test first: empty params, special chars, deterministic sorted output.

- [x] 1.3 **CacheModule registration** — Register `CacheModule.registerAsync` in `src/app.module.ts` with ioredis store (host/port from ConfigService, ttl from `CACHE_TTL`). Smoke test: module compiles without Redis running.

## Phase 2: CacheService

- [x] 2.1 **CacheService** — Create `src/modules/_shared/infrastructure/cache/cache.service.ts` with `getOrSet<T>(key, ttl, factory)`, `invalidate(key)`, `invalidateNamespace(pattern)`. All ops wrapped in try/catch (log via Logger + fallback to factory). Test first: hit returns cached, miss calls factory, factory error propagates, Redis unreachable falls back, SCAN+DEL removes matching keys.

## Phase 3: Use Case Caching & Invalidation

- [x] 3.1 **ListTipoBloquesUseCase.caching** — Inject `CacheService` + `ConfigService` for TTL. Wrap `repo.list(options)` in `getOrSet(CacheKeyBuilder.list('tipo_bloque', params), ttl, () => repo.list(options))`. Test first: DB NOT called on cache hit, correct key format, DB called on miss.

- [x] 3.2 **CreateTipoBloqueUseCase.invalidation** — Inject `CacheService`. Call `invalidateNamespace('tipo_bloque:*')` after successful `repo.create()` before return. Test first: invalidation called on success, NOT called on validation error.

- [x] 3.3 **UpdateTipoBloqueUseCase.invalidation** — Same pattern after `repo.update()`. Test first.

- [x] 3.4 **DeleteTipoBloqueUseCase.invalidation** — Same pattern after `repo.delete()`. Test first.
