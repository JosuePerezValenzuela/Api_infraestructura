# Redis Cache for Catalogs — Specification

## Purpose

Add Redis caching via `@nestjs/cache-manager` + ioredis to reduce DB load on read-heavy catalog endpoints. Pilot on tipo-bloque module; pattern deferred to other catalogs.

## Requirements

### R1: CacheService — getOrSet

`CacheService.getOrSet<T>(key, ttl, factory): Promise<T>` MUST return cached value when present, otherwise call factory, store result with TTL, and return it.

#### Scenario: Cache hit returns stored value

- GIVEN cache contains `tipo_bloque:list:hash`
- WHEN `getOrSet('tipo_bloque:list:hash', 300, factory)` is called
- THEN factory is NOT called
- AND cached value is returned

#### Scenario: Cache miss calls factory and stores

- GIVEN cache does NOT contain `tipo_bloque:list:hash`
- WHEN `getOrSet('tipo_bloque:list:hash', 300, factory)` is called
- THEN factory is called once
- AND result is stored with TTL 300
- AND result is returned

#### Scenario: Factory throws — error propagates

- GIVEN cache is empty
- WHEN `getOrSet(key, 300, factory)` is called and factory throws
- THEN error propagates to caller
- AND cache is NOT modified

### R2: CacheService — invalidate

`CacheService.invalidate(key): Promise<void>` MUST remove a specific key.

#### Scenario: Invalidate removes key

- GIVEN cache contains key
- WHEN `invalidate(key)` succeeds
- THEN next read for that key is a miss

### R3: CacheService — invalidateNamespace

`CacheService.invalidateNamespace(pattern): Promise<void>` MUST delete all keys matching a pattern via SCAN + DEL.

#### Scenario: Pattern removal clears matching keys

- GIVEN cache has `tipo_bloque:list:a` and `tipo_bloque:list:b`
- WHEN `invalidateNamespace('tipo_bloque:*')` succeeds
- THEN both keys are removed

### R4: CacheService — Redis failure isolation

CacheService MUST catch Redis errors, log them, and fall back to direct factory invocation. MUST NOT throw.

#### Scenario: Redis unreachable — getOrSet falls back

- GIVEN Redis connection fails
- WHEN `getOrSet(key, 300, factory)` is called
- THEN factory is called and result returned
- AND error is logged
- AND no exception escapes

#### Scenario: Redis unreachable — invalidate no-ops

- GIVEN Redis connection fails
- WHEN `invalidate(key)` or `invalidateNamespace(pattern)` is called
- THEN operation completes silently
- AND error is logged

### R5: Tipo-bloque list — caching

`ListTipoBloquesUseCase` MUST wrap DB query in `getOrSet` with key `tipo_bloque:list:{params_to_query_string(params)}` and TTL from `CACHE_TTL`.

#### Scenario: First request hits DB, caches result

- GIVEN no cache entry for params
- WHEN `ListTipoBloquesUseCase.execute()` is called
- THEN DB query is executed
- AND result is stored in cache

#### Scenario: Second request in TTL returns cached

- GIVEN cache has valid `tipo_bloque:list:{hash}`
- WHEN `ListTipoBloquesUseCase.execute()` is called within TTL
- THEN DB is NOT queried
- AND cached data is returned

#### Scenario: Expired TTL refreshes from DB

- GIVEN cache entry expired
- WHEN `ListTipoBloquesUseCase.execute()` is called
- THEN DB is queried
- AND fresh result is cached

### R6: Tipo-bloque writes — cache invalidation

Create, Update, and Delete tipo-bloque use cases MUST call `invalidateNamespace('tipo_bloque:*')` AFTER successful repository write.

#### Scenario: Create invalidates namespace



- GIVEN cache has tipo_bloque entries
- WHEN `CreateTipoBloqueUseCase.execute()` succeeds
- THEN `tipo_bloque:*` is invalidated
- AND next list is a cache miss (fresh from DB)

#### Scenario: Update invalidates namespace

- GIVEN cache has tipo_bloque entries
- WHEN `UpdateTipoBloqueUseCase.execute()` succeeds
- THEN `tipo_bloque:*` is invalidated
- AND next list is a cache miss

#### Scenario: Delete invalidates namespace

- GIVEN cache has tipo_bloque entries
- WHEN `DeleteTipoBloqueUseCase.execute()` succeeds
- THEN `tipo_bloque:*` is invalidated
- AND next list is a cache miss

### R7: Non-functional — TTL and key format

Default TTL SHALL be 300 seconds, configurable via `CACHE_TTL` env var. Cache keys MUST use pattern `tipo_bloque:list:{serialized_params}` with sorted key-value pairs as query string (e.g., `tipo_bloque:list:page=1&limit=10&orderBy=nombre&orderDir=asc`).

### R8: Non-functional — existing tests

All existing unit, integration, and e2e tests MUST pass without modification after cache changes.

### R9: CacheModule — configuration

`AppModule` MUST register `CacheModule.registerAsync` with ioredis store pointing to `REDIS_HOST:REDIS_PORT`, default TTL from `CACHE_TTL`, and graceful degradation when Redis is unavailable.

#### Scenario: CacheModule connects with env config

- GIVEN `REDIS_HOST=redis`, `REDIS_PORT=6379`, `CACHE_TTL=300`
- WHEN AppModule initializes
- THEN CacheModule connects to redis:6379
- AND default TTL is 300 seconds

#### Scenario: CacheModule without Redis — app starts

- GIVEN Redis is not running
- WHEN AppModule initializes
- THEN app starts without error
- AND cache operations fall through silently
