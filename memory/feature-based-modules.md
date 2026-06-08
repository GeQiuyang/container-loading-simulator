# Feature-Based Module Organization

**Type**: project
**Category**: Architecture Pattern

## What It Is

The project uses a **feature-based directory structure** where business logic is organized by domain feature rather than by technical concern. This is visible from:

1. `tailwind.config.ts` content paths include `./src/features/**/*` alongside the standard `app/` and `components/` paths.
2. The directory `src/features/` exists (with `.gitkeep`) as a dedicated location for feature modules.
3. `components.json` aliases for shadcn reflect this: `components/`, `lib/`, `hooks/` are kept at the `src/` root for shared code, while feature-specific logic goes into `features/<feature-name>/`.

The `src/` layout is:
```
src/
  app/         — Next.js App Router (pages, layouts, API routes)
  components/  — Shared UI components (shadcn)
  features/    — Domain feature modules (each feature self-contained)
  hooks/       — Shared custom hooks
  lib/         — Shared library utilities (prisma client, utils)
  services/    — External service integrations (APIs, third-party)
  types/       — Shared TypeScript types
```

## How to Use

When adding a new domain capability (e.g., "container-3d-viewer", "loading-optimizer"):

1. Create a directory under `src/features/<feature-name>/`.
2. Each feature module should be self-contained with its own:
   - `components/` — feature-specific UI
   - `hooks/` — feature-specific hooks
   - `types.ts` — feature-specific types
   - `utils.ts` — feature-specific utilities
   - `services.ts` — feature-specific data access

3. Keep shared code at the `src/` root level (`components/`, `hooks/`, `lib/`, `types/`).

4. Import from features using `@/features/<feature-name>/...`.

## Rationale

This pattern prevents the "barrel of components" anti-pattern where all components live in a single directory. As the project grows, features remain independently discoverable and maintainable.
