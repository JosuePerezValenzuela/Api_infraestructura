# Proposal: Redis Cache for Catalogs

## Intent

Catalogs are read-heavy and change infrequently. Each list request hits the database directly, adding latency and load. Caching with Redis reduces DB pressure and speeds up reads for repeated queries.

## Scope

### In Scope
- Configure `@nestjs/cache-manager` with Redis (host: redis, port: 6379, TTL: 300s)
- Create `CacheService` at `_shared/infrastructure/cache/` — `getOrSet`, `invalidate`, `invalidateNamespace`
- Apply caching to `tipo-bloque` module: list caches, write ops invalidate `tipo_bloque:*`
- Environment vars: `REDIS_HOST`, `REDIS_PORT`, `CACHE_TTL` (default 300)
- Validation in `src/config/validation.ts` and `.env.example`

### Out of Scope
- Caching other catalog modules (campus, facultad, etc.) — pattern deferred
- Distributed cache eviction or pub/sub invalidation
- Cache warm-up on startup

## Capabilities

### New Capabilities
- `cache-service`: Shared Redis caching wrapper (`getOrSet`, `invalidate`, `invalidateNamespace`)

### Modified Capabilities
- `tipo-bloque-catalog`: List reads MUST cache results; writes MUST invalidate `tipo_bloque:*` namespace

## Approach

1. Register `CacheModule` in `AppModule` via `@nestjs/cache-manager` with `ioredis` store
2. Create `CacheService` in `_shared/infrastructure/cache/` wrapping `CacheManager`
3. `ListTipoBloquesUseCase`: call `getOrSet(key, ttl, repo.list)` before DB fallback
4. `CreateTipoBloqueUseCase`: call `invalidateNamespace('tipo_bloque:*')` after repo create
5. `UpdateTipoBloqueUseCase`: same invalidation after repo update
6. `DeleteTipoBloqueUseCase`: same invalidation after repo delete
7. Add `REDIS_HOST`, `REDIS_PORT`, `CACHE_TTL` to validation.ts and `.env.example`

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app.module.ts` | Modified | Register `CacheModule` |
| `src/modules/_shared/infrastructure/cache/` | New | `CacheService` + spec |
| `src/modules/tipo-bloque/application/*.usecase.ts` | Modified | Add cache decorator calls |
| `src/config/validation.ts` | Modified | Add Redis env vars |
| `.env.example` | Modified | Add `CACHE_TTL` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Stale cache on write | Low | Invalidate namespace on every write op |
| Redis down cascades to app | Med | `CacheService` wraps calls in try/catch, falls back to DB |
| Key collision between features | Low | Prefix: `tipo_bloque:` per module |

## Rollback Plan

Revert single commit: remove `CacheModule` from `AppModule`, delete `CacheService`, revert use case changes. If Redis is unreachable, the try/catch fallback keeps the system working — rollback is non-urgent.

## Dependencies

- Redis already in docker-compose (`redis:alpine3.23`)
- `@nestjs/cache-manager`, `cache-manager`, `cache-manager-ioredis`, `ioredis` already in `package.json`

## Success Criteria

- [ ] `ListTipoBloquesUseCase` returns cached data on repeat requests (< 50ms cached vs DB time)
- [ ] Create/Update/Delete invalidates `tipo_bloque:*`, next list returns fresh data
- [ ] All existing tests pass without modification
- [ ] Redis unreachable → system works (DB fallback, no crash, error logged)
