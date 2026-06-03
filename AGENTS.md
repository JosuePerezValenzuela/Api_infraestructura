# Repository Guidelines

- Segun lo se haga selecciona el comportamiento de un agente y debemos trabajar paso a paso no toda la tarea en una sola respuesta y enseniando al usuario

## Architecture: Scope Rule

- **Global**: Used by 2+ features
- **Local**: Used by 1 feature only

## About the proyect

- Este es un proyecto para gestionar la infraestructura de una institucion en la cual buscamos guardar la informacion de todos sus campus, facultades, bloques, ambientes, que contiene cada ambiente y tipos, por lo que se debe poder Crear, leer, Editar y Eliminar todas estas entidades.
  Mas especificaciones del proyecto estan en `Project_Specs.md`

- Manejo de errores (patrón global observado):
  - Validación: `BadRequestException` con cuerpo `{ error: 'VALIDATION_ERROR', message: 'Los datos enviados no son validos', details: [{ field, message }] }`.
  - Conflictos: `ConflictException` con `{ error: 'CONFLICT_ERROR', message, details }`.
  - Recurso no encontrado: `NotFoundException` con `{ error: 'NOT_FOUND', message }`.
  - Aplicar este formato en nuevos casos de uso/controladores.

## DataBase

- Usamos PostgreSQL y la migracion esta en `src/migrations`.

## Project Structure & Module Organization

- `src/app.module.ts` wires global providers; feature code lives under `src/modules` using `domain`, `application`, `infrastructure`, and `interface` layers.
- Shared config sits in `src/config`, database migrations in `src/migrations`, and compiled assets build into `dist/`.
- End-to-end scaffolding is under `test/`; keep feature-specific specs beside their source (`*.spec.ts`).

## Container Execution

- El proyecto corre dentro de un devcontainer. **Todos los comandos del proyecto** (pnpm install, build, lint, test, format, migration, etc.) se ejecutan **dentro del contenedor `app`**, no en la máquina host.
- Para ejecutar comandos dentro del contenedor: `docker compose -f .devcontainer/docker-compose.yml exec app <comando>`.

## Build, Test, and Development Commands

- `pnpm install` resolves dependencies; use the workspace lockfile.
- `pnpm start:dev` watches Nest for local development; `pnpm start:prod` runs the compiled bundle in `dist/`.
- `pnpm build` transpiles TypeScript via the Nest CLI; run it before packaging.
- `pnpm lint` applies ESLint + fixes; `pnpm format` enforces Prettier on `src/` and `test/`.
- `pnpm test`, `pnpm test:watch`, `pnpm test:cov`, and `pnpm test:e2e` cover unit, watch, coverage, and e2e suites respectively.

## Coding Style & Naming Conventions

- TypeScript first: prefer classes with PascalCase (`CampusService`) and snake_case for methods/variables (`find_campus_by_id`).
- Maintain 2-space indentation, single quotes, and trailing commas per `.prettierrc`.
- Keep Nest module files suffixed by role (`*.module.ts`, `*.controller.ts`, `*.service.ts`) and align DTOs under `application`.
- Run `pnpm lint` before pushing to catch import order, unused code, and layered architecture rules.

## Testing Guidelines

- Jest is configured with `src` as `rootDir`; create unit specs as `*.spec.ts` near the implementation.
- Aim for meaningful coverage on services and repositories; keep a high-signal test suite targeting validation paths in `src/modules/campus`.
- Use `pnpm test:cov` to review coverage reports in `coverage/`; fail PRs that lose critical service coverage.
- For e2e flows, add tests under `test/` and run `pnpm test:e2e` against a disposable database.

## Configuration & Security Tips

- Duplicate `/.env.example` to `.env` and validate with `src/config/validation.ts`; never commit secrets.
- Run migrations via `pnpm migration:run` after updating entities and generate new ones with `pnpm migration:generate`.
- Keep throttling, Helmet, and Swagger options consistent with `main.ts`; flag config changes during review.

## RULES

- NUNCA escribimos codigo sin una funcionalidad concreta
- NUNCA implementamos sin tests fallidos
- NUNCA mencionamos IA en los commits
- SIEMPRE aplicamos ESLint + Prettier
