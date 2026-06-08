# Prisma Client Singleton (globalThis pattern)

**Type**: project
**Category**: Infrastructure Pattern

## What It Is

The Prisma client is exported as a singleton using the `globalThis` pattern to prevent multiple `PrismaClient` instances during Next.js hot-reload in development.

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

## How to Use

Import the `prisma` singleton anywhere server-side code needs database access:

```typescript
import { prisma } from '@/lib/prisma';

// Server component, API route, or Server Action
const containers = await prisma.container.findMany();
```

## Important Rules

1. **Server-side only**: Never import `prisma` in client components (`'use client'`). PrismaClient is a Node.js-native module and will not work in the browser.
2. **Single import path**: Always import from `@/lib/prisma` — do not create additional `PrismaClient` instances.
3. **The `globalThis` pattern is specific to development**: In production (`NODE_ENV === 'production'`), the singleton is created once per request cycle (standard), and the global cache is skipped.

## Rationale

Next.js's hot module replacement (HMR) in development would otherwise create a new `PrismaClient` instance on every file save, quickly exhausting database connections. The `globalThis` pattern stores the instance on the global object, which persists across HMR reloads.
