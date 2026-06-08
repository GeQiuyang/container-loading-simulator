# Prisma 7 Config-as-Code Pattern

**Type**: project
**Category**: Infrastructure Pattern

## What It Is

Prisma 7 introduces a **config-as-code** pattern that separates datasource configuration from the Prisma schema file. Instead of embedding the database connection URL in `prisma/schema.prisma`, it is defined in `prisma.config.ts` using the `defineConfig` and `env()` helpers.

### Before (Prisma 6 and earlier)
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### After (Prisma 7)
```typescript
// prisma.config.ts
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
```

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
}
```

## How to Use

1. **Environment variables**: The `env()` helper reads from `process.env`. The `import 'dotenv/config'` at the top of `prisma.config.ts` ensures `.env` is loaded automatically.

2. **Adding datasources**: For multiple databases, add additional entries to the `datasource` object in `prisma.config.ts`.

3. **Migration path**: Migrations are stored in `prisma/migrations/` by default but can be customized via the `migrations.path` option.

4. **Commands**: Standard Prisma CLI commands (`prisma generate`, `prisma migrate dev`, `prisma db push`) work identically — they auto-detect `prisma.config.ts`.

## Rationale

- **Cleaner separation of concerns**: Schema defines the data model; config defines infrastructure.
- **Type-safe configuration**: TypeScript config gives autocomplete and validation.
- **Multi-environment support**: Different environments can easily swap configs without touching the schema.
- **Programmatic configuration**: Config can be generated or computed at runtime (e.g., reading from secret managers).
