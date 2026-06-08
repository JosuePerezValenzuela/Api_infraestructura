# Design: Redis Cache — Facultad

## Technical Approach

Mechanical extension of the proven catalog caching pattern (campus, tipo-ambiente, tipo-bloque). Layer `CacheService.getOrSet` on `ListFacultadesUseCase` and `CacheService.invalidateNamespace` on all three write use cases (create, update, delete). No new infrastructure — reuses existing `CacheService`, `CacheKeyBuilder`, and `CACHE_TTL` env var.

Facultad differs from prior modules: list uses `page/take` params with `findPaginated()` returning `{ items, meta }` directly, and delete is relationship-based with two code paths. Caching adapts to these differences without changing existing logic.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| Cache strategy | Cache-aside (`getOrSet`) | Write-through, cache-through | Proven in 3 prior catalog modules; wraps repo call transparently |
| Invalidation scope | `invalidateNamespace('facultad:*')` | Per-key eviction | Single wildcard covers all param variations; simpler than tracking individual keys |
| Invalidation timing | After repo write, before return | Before write, in a hook | Ensures cache only cleared after successful write; failed writes don't invalidate |
| Delete invalidation point | After the if/else decision block | Inside each branch | Single call avoids duplication; both branches end with a write |
| TTL source | `CACHE_TTL` env var (default 300s) | Hardcoded, per-module TTL | Consistent across all catalog modules; already configured |
| Key naming | `page=` / `take=` (facultad convention) | `skip=` / `take=` (campus convention) | Uses facultad's existing `ListFacultadesQuery` shape directly |

## Architecture

```
┌─────────────────────────────────────────────────┐
│               FacultadModule                     │
│  ┌──────────────────────────────────────────┐   │
│  │              Use Cases                    │   │
│  │  ListFacultades ────getOrSet─────────┐   │   │
│  │  CreateFacultad ───invalidateNamespace│   │   │
│  │  UpdateFacultad ───invalidateNamespace│──┼──┤Cache│
│  │  DeleteFacultad ───invalidateNamespace│   │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

## Data Flow

### Read (list)

```
execute({ page, take, search, orderBy, orderDir, activo })
  → defaults (page=1, take=8, orderBy='nombre', orderDir='asc')
    → CacheKeyBuilder.list('facultad', { page, take, search, orderBy, orderDir, activo })
      → cacheService.getOrSet(key, ttl, () => repo.findPaginated(query))
        → returns { items, meta }
```

`CacheKeyBuilder` filters out `undefined`/`null` params — different filters produce distinct keys.

### Write (create/update/delete)

```
execute(payload) → validate → repo.write(payload) → invalidateNamespace('facultad:*') → return response
```

For delete specifically:
```
validate existence → validate relationship → deleteRelationship(id, campusId)
  → hasOtherRelationships(id)?
    ├── no → deleteFacultad(id) → return { deletedFacultad: true }
    └── yes → return { deletedFacultad: false }
  → invalidateNamespace('facultad:*')  ← single call after both branches
```

Invalidation always runs after the repo operation succeeds. If the repo throws, the cache is NOT invalidated (line is never reached).

## Cache Key Format

```
facultad:list:activo=true&orderBy=nombre&orderDir=asc&page=1&take=8
facultad:list:activo=false&orderBy=creado_en&orderDir=desc&page=1&take=25
facultad:list:orderBy=nombre&orderDir=asc&page=2&search=medicina&take=10
facultad:list:activo=true&orderBy=codigo&orderDir=asc&page=1&take=8
```

Generated deterministically by `CacheKeyBuilder.list('facultad', params)` — keys sorted alphabetically, `undefined`/`null` values excluded.

## Invalidation

`invalidateNamespace('facultad:*')` — SCAN + DEL matching keys. Single wildcard covers all list param variations.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/modules/facultad/application/list-facultades.usecase.ts` | Modify | Inject `CacheService` + `ConfigService`, build key via `CacheKeyBuilder.list('facultad', ...)`, wrap `repo.findPaginated()` in `cacheService.getOrSet()` |
| `src/modules/facultad/application/create-facultad.usecase.ts` | Modify | Inject `CacheService`, call `invalidateNamespace('facultad:*')` after `repo.create()` |
| `src/modules/facultad/application/update-facultad.usecase.ts` | Modify | Inject `CacheService`, call `invalidateNamespace('facultad:*')` after update + optional cascade |
| `src/modules/facultad/application/delete-facultad.usecase.ts` | Modify | Inject `CacheService`, call `invalidateNamespace('facultad:*')` after the if/else block (after both deleteRelationship and possible deleteFacultad) |
| `src/modules/facultad/application/list-facultades.usecase.spec.ts` | Modify | Add cache hit/miss/Redis error tests |
| `src/modules/facultad/application/create-facultad.usecase.spec.ts` | Modify | Add invalidation test for successful create |
| `src/modules/facultad/application/update-facultad.usecase.spec.ts` | **Create** | New file — add existing update tests + cache invalidation test |
| `src/modules/facultad/application/delete-facultad.usecase.spec.ts` | Modify | Add invalidation test for both delete paths |
| `src/modules/facultad/facultad.module.ts` | Modify | Add `CacheService` to `providers` array |

## Interfaces / Contracts

No new interfaces. Existing contracts remain unchanged:

- `CacheService.getOrSet<T>(key, ttl, factory)` — wraps factory with cache-aside
- `CacheService.invalidateNamespace(pattern)` — SCAN + DEL by wildcard
- `CacheKeyBuilder.list(resource, params)` — deterministic key generation
- `ConfigService.get('CACHE_TTL', 300)` — TTL from env

All use cases return the same shapes they do today — caching is transparent to callers.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | List — cache hit returns cached data without calling repo | Mock `cacheService.getOrSet` to return cached value; verify `repo.findPaginated` NOT called |
| Unit | List — cache miss calls repo and caches result | Mock `getOrSet` to invoke factory; verify `repo.findPaginated` IS called |
| Unit | List — Redis error falls through to DB | Mock `getOrSet` to throw then invoke factory; verify response comes from repo |
| Unit | Create — invalidation called after successful create | Mock `cacheService.invalidateNamespace`; verify called with `'facultad:*'` |
| Unit | Update — invalidation called after successful update | Same mock/verify pattern |
| Unit | Delete — invalidation called on both delete paths | Verify `invalidateNamespace` called whether `deletedFacultad` is true or false |
| Unit | Write use cases — invalidation NOT called on error | Force repo to throw; verify `invalidateNamespace` NOT called |

## Migration / Rollout

No migration required. No schema changes, no config changes — `CACHE_TTL` is already deployed. Pure code change hot-deployable via standard PR.

## Open Questions

- [ ] None — pattern is mechanical and proven in 3 prior modules
