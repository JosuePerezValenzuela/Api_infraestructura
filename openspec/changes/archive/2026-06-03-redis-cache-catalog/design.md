# Design: Redis Cache for Catalogs (Tipo-Bloque Pilot)

## Technical Approach

Layer a shared `CacheService` over `@nestjs/cache-manager` + ioredis to intercept tipo-bloque list reads with `getOrSet` and invalidate the `tipo_bloque:*` namespace on every write. Redis failures are caught silently — the system degrades to direct DB calls. Cache keys use sorted query-string format (not hash) per spec R7.

## Architecture Decisions

### Decision: How to access Redis for SCAN + DEL

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Inject `ioredis` directly as a separate provider | Duplicate connection config, out-of-sync with cache-manager | ❌ |
| Extract client from `CACHE_MANAGER` store's `.client` property | Single source of truth; cast required but type-safe behind `CacheService` boundary | ✅ |
| Use `cache-manager` v7 `store.keys` pattern | Not all stores implement `keys` efficiently; SCAN is the Redis-native pattern | ❌ |

**Rationale**: `cache-manager-ioredis` v2 creates a `RedisCache` whose `.store.client` is the ioredis `Redis` instance. `CacheService` encapsulates this cast so callers never touch it.

### Decision: CacheKeyBuilder key format

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Hash (MD5/SHA) of params | Opaque, hard to debug, hard to invalidate by prefix | ❌ |
| Sorted query-string | Human-readable, deterministic, SCAN-able via `tipo_bloque:*` prefix | ✅ |

**Rationale**: Query-string keys enable prefix-based namespace invalidation (`tipo_bloque:list:page=1&...`) — we can SCAN for `tipo_bloque:*` and DEL everything without knowing individual keys.

### Decision: Error isolation strategy

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Let Redis errors propagate | One Redis hiccup takes down the API | ❌ |
| try/catch in every caller | Duplicated boilerplate | ❌ |
| try/catch inside `CacheService` methods, log + fallback | Single point, consistent behavior, always degrades gracefully | ✅ |

**Rationale**: `CacheService` wraps every Redis operation in try/catch. On Redis failure, `getOrSet` calls the factory directly, `invalidate`/`invalidateNamespace` no-op. Errors go to `Logger` — the app never crashes from a cache miss.

## Data Flow

```
ListTipoBloquesUseCase.execute(params)
  │
  ├─► CacheKeyBuilder.list('tipo_bloque', params) → "tipo_bloque:list:limit=6&orderBy=nombre&orderDir=asc&page=1"
  │
  ├─► CacheService.getOrSet(key, CACHE_TTL, factory)
  │      │
  │      ├─ Redis GET key → hit? → return cached value
  │      │                    miss? → call factory → Redis SET → return
  │      │                    error? → log → call factory → return (degraded)
  │      │
  │      └─ factory = () => this.repo.list(options)
  │
  └─► returns ListTipoBloquesResult


Create/Update/DeleteTipoBloqueUseCase.execute(command)
  │
  ├─► repo.write(command)   ← DB write
  │
  └─► CacheService.invalidateNamespace('tipo_bloque:*')
         │
         ├─ Redis SCAN 'tipo_bloque:*' → [keys]
         ├─ Redis DEL key1 key2 ...
         └─ error? → log → no-op
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/modules/_shared/infrastructure/cache/cache.service.ts` | Create | Wraps CacheManager: getOrSet, invalidate, invalidateNamespace |
| `src/modules/_shared/infrastructure/cache/cache.service.spec.ts` | Create | Unit tests: hit/miss/error/degradation paths |
| `src/modules/_shared/infrastructure/cache/cache-key-builder.ts` | Create | `list(resource, params)` → sorted query-string key |
| `src/app.module.ts` | Modify | Add `CacheModule.registerAsync` with ioredis config |
| `src/config/validation.ts` | Modify | Add `REDIS_HOST`, `REDIS_PORT`, `CACHE_TTL` Joi validation |
| `.env.example` | Modify | Add `CACHE_TTL=300` |
| `src/modules/tipo-bloque/application/list-tipo-bloques.usecase.ts` | Modify | Inject CacheService, wrap repo.list in getOrSet |
| `src/modules/tipo-bloque/application/create-tipo-bloque.usecase.ts` | Modify | Inject CacheService, call invalidateNamespace after create |
| `src/modules/tipo-bloque/application/update-tipo-bloque.usecase.ts` | Modify | Inject CacheService, call invalidateNamespace after update |
| `src/modules/tipo-bloque/application/delete-tipo-bloque.usecase.ts` | Modify | Inject CacheService, call invalidateNamespace after delete |
| `src/modules/tipo-bloque/application/*.usecase.spec.ts` | Modify | Add CacheService mock + cache assertions |

## Interfaces / Contracts

```ts
// CacheKeyBuilder
class CacheKeyBuilder {
  static list(resource: string, params: Record<string, any>): string
  // → "tipo_bloque:list:limit=6&orderBy=nombre&...&page=1"
}

// CacheService
class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getOrSet<T>(key: string, ttl: number, factory: () => Promise<T>): Promise<T>
  async invalidate(key: string): Promise<void>
  async invalidateNamespace(pattern: string): Promise<void>
  // All three catch Redis errors, log via Logger, and fall through.
}
```

### List use-case cache change (exact diff)

```ts
// Constructor adds cache injection
constructor(
  @Inject(TipoBloqueRepositoryPort) private readonly repo: TipoBloqueRepositoryPort,
  private readonly cache: CacheService,           // ← NEW
  @Inject(CACHE_TTL) private readonly defaultTtl: number,  // ← NEW
) {}

// Before repo.list:
const cacheKey = CacheKeyBuilder.list('tipo_bloque', { page, limit, orderBy, orderDir, search, activo });
return this.cache.getOrSet(cacheKey, this.defaultTtl, () => this.repo.list(options));
```

### Write use-case invalidation (exact diff)

```ts
// After repo.create() / repo.update() / repo.delete() succeeds:
await this.cache.invalidateNamespace('tipo_bloque:*');
// (placed after the repo call, before the return)
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | CacheService.getOrSet | Mock CacheManager: hit returns cached, miss calls factory, factory error propagates, Redis error falls back to factory |
| Unit | CacheService.invalidateNamespace | Mock store.client to verify SCAN + DEL called with pattern |
| Unit | ListTipoBloquesUseCase caching | Mock CacheService: verify getOrSet called with correct key, repo.list NOT called on cache hit |
| Unit | Create/Update/Delete invalidation | Mock CacheService: verify invalidateNamespace('tipo_bloque:*') called after successful write |

### CacheService mock for use case tests

```ts
const mockCache = {
  getOrSet: jest.fn().mockImplementation((_key, _ttl, factory) => factory()),
  invalidate: jest.fn().mockResolvedValue(undefined),
  invalidateNamespace: jest.fn().mockResolvedValue(undefined),
};
// Pass as: { provide: CacheService, useValue: mockCache }
```

## Migration / Rollout

No data migration required. Cache is ephemeral — Redis starts empty, populates on first request. If Redis is unreachable, the app degrades gracefully. Rollback = revert single commit.

## Open Questions

- [ ] Determine the exact property path to the ioredis client from `cache-manager-ioredis` v2 store — requires verifying at runtime during implementation
