# Design: Redis Cache — Campus

## Technical Approach

Mechanical extension of the proven catalog caching pattern (tipo-ambiente, tipo-bloque). Layer `CacheService.getOrSet` on the list use case and `CacheService.invalidateNamespace` on all three write use cases (create, update, delete). No new infrastructure — reuses existing `CacheService`, `CacheKeyBuilder`, and `CACHE_TTL` env var.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| Cache strategy | Cache-aside (getOrSet) | Write-through, cache-through | `getOrSet` already proven in 2 catalog modules; matches NestJS pattern of wrapping the repo call |
| Invalidation scope | `invalidateNamespace('campus:*')` | Per-key eviction | Single wildcard covers all param variations; simpler than tracking which keys exist |
| Invalidation timing | After repo write, before return | Before write, in a hook | Ensures cache is only cleared after a successful write; failed writes don't invalidate |
| TTL source | `CACHE_TTL` env var (default 300s) | Hardcoded, per-module TTL | Consistent across all catalog modules; already configured in deployment |

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  CampusModule                    │
│  ┌──────────────────────────────────────────┐   │
│  │              Use Cases                    │   │
│  │  ListCampus ──────getOrSet───────────┐   │   │
│  │  CreateCampus ────invalidateNamespace─┤   │   │
│  │  UpdateCampus ────invalidateNamespace─┤Cache│  │
│  │  DeleteCampus ────invalidateNamespace─┤Svc  │  │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

## Data Flow

### Read (list)

```
ListCampusInput → defaults (skip=0, take=10, orderBy=creado_en, direction=asc)
  → CacheKeyBuilder.list('campus', {skip, take, search, orderBy, direction, activo})
    → cacheService.getOrSet(key, ttl, () => repo.list(options))
      → returns { items, meta }
```

CacheKey ignores `undefined`/`null` params — different filters produce distinct keys automatically.

### Write (create/update/delete)

```
execute(payload) → validate → repo.write(payload) → invalidateNamespace('campus:*') → return response
```

Invalidation always happens after the repo operation succeeds. If the repo throws, the cache is NOT invalidated (correct by construction since the line is never reached).

## Cache Key Format

```
campus:list:activo=true&direction=asc&orderBy=nombre&search=null&skip=0&take=10
campus:list:activo=false&direction=desc&orderBy=creado_en&search=sur&skip=0&take=25
campus:list:direction=asc&orderBy=creado_en&skip=0&take=10
```

Generated deterministically by `CacheKeyBuilder.list('campus', params)` — keys are sorted alphabetically, undefined/null values excluded.

## Invalidation

`invalidateNamespace('campus:*')` — SCAN + DEL matching keys. Single wildcard covers all list param variations.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/modules/campus/application/list-campus.usecase.ts` | Modify | Inject `CacheService` + `ConfigService`, wrap `repo.list()` in `cacheService.getOrSet()` |
| `src/modules/campus/application/create-campus.usecase.ts` | Modify | Inject `CacheService`, call `invalidateNamespace('campus:*')` after `repo.create()` |
| `src/modules/campus/application/update-campus.usecase.ts` | Modify | Inject `CacheService`, call `invalidateNamespace('campus:*')` after cascade step |
| `src/modules/campus/application/delete-campus.usecase.ts` | Modify | Inject `CacheService`, call `invalidateNamespace('campus:*')` after `repo.delete()` |
| `src/modules/campus/application/list-campus.usecase.spec.ts` | Modify | Add tests: cache hit returns cached data, cache miss calls repo, Redis error falls through |
| `src/modules/campus/application/create-campus.usecase.spec.ts` | Create | Add invalidation test for successful create |
| `src/modules/campus/application/update-campus.usecase.spec.ts` | Modify | Add invalidation test for successful update |
| `src/modules/campus/application/delete-campus.usecase.spec.ts` | Modify | Add invalidation test for successful delete |
| `src/modules/campus/campus.module.ts` | Modify | Add `CacheService` to `providers` array |

Note: `delete-campus.usecase.spec.ts` and `update-campus.usecase.spec.ts` exist but have no current cache tests — adding invalidation scenarios. `create-campus.usecase.spec.ts` does not exist yet and needs creation.

## Interfaces / Contracts

No new interfaces. Existing contracts remain unchanged:

- `CacheService.getOrSet<T>(key: string, ttl: number, factory: () => Promise<T>): Promise<T>` — wraps factory with cache-aside
- `CacheService.invalidateNamespace(pattern: string): Promise<void>` — SCAN + DEL by wildcard
- `CacheKeyBuilder.list(resource: string, params: Record<string, any>): string` — deterministic key generation
- `ConfigService.get('CACHE_TTL')` — TTL from env, default 300s

All use cases return the same shapes they do today — caching is transparent to callers.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | ListCampus — cache hit returns cached data without calling repo | Mock `CacheService.getOrSet` to return cached value; verify `repo.list` is NOT called |
| Unit | ListCampus — cache miss calls repo and caches result | Mock `getOrSet` to invoke factory; verify `repo.list` IS called and result is returned |
| Unit | ListCampus — Redis error falls through to DB | Mock `getOrSet` to throw then call factory; verify response comes from repo |
| Unit | CreateCampus — invalidation called after successful create | Mock `CacheService.invalidateNamespace`; verify called with `'campus:*'` |
| Unit | UpdateCampus — invalidation called after successful update | Same mock/verify pattern |
| Unit | DeleteCampus — invalidation called after successful delete | Same mock/verify pattern |
| Unit | Write use cases — invalidation NOT called on error | Force repo to throw; verify `invalidateNamespace` was NOT called |

## Migration / Rollout

No migration required. No schema changes, no config changes — `CACHE_TTL` is already deployed. This is a pure code change hot-deployable via standard PR.

## Open Questions

- [ ] None — pattern is mechanical and proven in 2 prior modules
