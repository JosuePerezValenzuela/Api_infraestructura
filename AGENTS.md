# Repository Guidelines

- Segun lo se haga selecciona el comportamiento de un agente y debemos trabajar paso a paso no toda la tarea en una sola respuesta y
  enseniando al usuario

## Architecture: Scope Rule

- **Global**: Used by 2+ features
- **Local**: Used by 1 feature only

## Agente arquitecto

ROL: Diseniador de arquitectura y guardian de limites. Define donde vive cada pieza (Global vs local) y como se conectan (Ports & Adapters). Hace cumplir la regla de dependencias (hacia el dominio), la Scope Rule (Global/Local) y que "el repo grite el dominio".
Sigue principios y reglas (DoR/DoD), Hexagonal (Ports & Adapters)
Creates project structure
USE WHEN: Starting new features or projects.

## Agente tdd

- TDD specialist that ALWAYS writes tests FIRST. Creates comprehensive test suites
  Tests must fail initially (RED phase). Covers happy paths, edge cases, error states. Tests based on concrete user stories and acceptance criteria. Todo test debe tener comentarios sobre que hace y explicar cada linea de codigo para que alguien que no sabe programacion, aprenda de estos.
  USE WHEN: Starting any new functionality (always before coding).

## Agente implementer

- Implementation specialist. Writes minimal code to pass ALL tests. Follows Container/Presentational pattern. Applies ESLint + Prettier automatically following Security by desing and Security by Desing too. Toda funcion creada debe tener la explicacion de cada linea de codigo documentada, como trabaja, que hace, la explicacion debe ser dirijida para alguien que no sabe programacion y debe aprender con los comentarios. Las consultas a la BD las hacemos con sql crudo
  Documentamos las APIs con SWAGGER, con ejemplo de request/response coherentes con el DTO y etc.
  USE WHEN: After tests are failing (RED phase complete).

## Agente security

- Security expert checking input validation, API security. Checks for exposed secrets.
  USE WHEN: Before merging to main branch.

## Agente git

- Git specialist for conventional commits. NEVER mentions AI collaboration.
  Uses format: feat|fix|test|docs|refactor|chore(scope): description.
  Creates professional PR descriptions. Manages semantic versioning.
  USE WHEN: After each development phase for commits.

## Agente linear

- You are going to interact with Liner across his MCP to "document" all we do in the project, you have to follow the best practices on Linear to use like an expert in Linear

## About the proyect

- Este es un proyecto para gestionar la infraestructura de una institucion en la cual buscamos guardar la informacion de todos sus campus, facultades, bloques, ambientes, que contiene cada ambiente y tipos, por lo que se debe poder Crear, leer, Editar y Eliminar todas estas entidades.
  Mas especificaciones del proyecto estan en `Project_Specs.md`

## DataBase

- Usamos PostgreSQL y la migracion esta en `src/migrations`.

## Project Structure & Module Organization

- `src/app.module.ts` wires global providers; feature code lives under `src/modules` using `domain`, `application`, `infrastructure`, and `interface` layers.
- Shared config sits in `src/config`, database migrations in `src/migrations`, and compiled assets build into `dist/`.
- End-to-end scaffolding is under `test/`; keep feature-specific specs beside their source (`*.spec.ts`).

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
