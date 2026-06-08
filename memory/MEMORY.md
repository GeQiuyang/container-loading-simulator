# MEMORY.md — Project Design Concepts Index

This file catalogs the design concepts, patterns, and abstractions used in this project.

## Architecture Patterns

- [Feature-Based Module Organization](./feature-based-modules.md) — Domain logic organized by feature (src/features/) rather than technical concern.
- [Prisma 7 Config-as-Code](./prisma-7-config-as-code.md) — Separating datasource configuration from schema definition using prisma.config.ts.
- [Prisma Client Singleton (globalThis)](./prisma-client-singleton.md) — Preventing multiple PrismaClient instances during Next.js HMR.

---

*Last updated: 2026-06-08*
