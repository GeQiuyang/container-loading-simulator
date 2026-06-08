# Container Loading Simulator — Framework Scaffolding Design

**Date:** 2026-06-08
**Status:** Approved

## Overview

Scaffold a Next.js 15 project with the full production-ready tech stack. No business features — framework foundation only.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 15 |
| UI Library | React | 19 |
| Language | TypeScript | 5.x (strict) |
| Styling | Tailwind CSS | 4.x |
| Components | Shadcn UI | latest (new-york style) |
| ORM | Prisma | 6.x |
| Database | PostgreSQL | 16 (Docker) |
| Forms | React Hook Form | latest |
| Validation | Zod | latest |
| Package Manager | pnpm | latest |

## Project Structure

```
Container-Loading-Simulator/
├── docker/
│   └── docker-compose.yml        # PostgreSQL 16 + pgAdmin
├── prisma/
│   └── schema.prisma             # Container, CargoItem models
├── public/                       # Static assets
├── src/
│   ├── app/
│   │   ├── globals.css           # Tailwind + Shadcn CSS variables
│   │   ├── layout.tsx            # Root Layout (Inter font, zh-CN lang)
│   │   └── page.tsx              # Home page
│   ├── components/
│   │   └── ui/                   # Shadcn UI components (Button, Card)
│   ├── features/                 # Feature modules (empty, with .gitkeep)
│   ├── services/                 # Service layer (empty, with .gitkeep)
│   ├── lib/
│   │   ├── prisma.ts             # Prisma Client singleton
│   │   └── utils.ts              # cn() utility
│   ├── types/                    # Global types (empty, with .gitkeep)
│   └── hooks/                    # Custom hooks (empty, with .gitkeep)
├── .env                          # Local env (gitignored)
├── .env.example                  # Env template
├── eslint.config.mjs             # ESLint flat config
├── .prettierrc                   # Prettier config
├── .prettierignore
├── .gitignore
├── components.json               # Shadcn UI config
├── next.config.ts
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json                 # Strict Mode
└── package.json
```

## Configuration Files

### TypeScript (`tsconfig.json`)
- `strict: true`
- `noUncheckedIndexedAccess: true`
- Path alias `@/*` → `./src/*`
- Next.js plugin for IDE support

### ESLint (`eslint.config.mjs`)
- Flat config format (Next.js 15 default)
- `next/core-web-vitals` + `@typescript-eslint/recommended`
- Rules: `@typescript-eslint/no-unused-vars` (warn), `@typescript-eslint/no-explicit-any` (warn)

### Prettier (`.prettierrc`)
- semi, singleQuote, tabWidth 2, trailingComma all
- `prettier-plugin-tailwindcss` for class sorting

### Environment Variables
- `DATABASE_URL` — Prisma connection string
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` — Docker Compose
- `.env` gitignored, `.env.example` committed

### Docker Compose
- PostgreSQL 16 on port 5432
- pgAdmin on port 5050
- Data persisted via named volume `docker-data`

### Shadcn UI (`components.json`)
- Style: `new-york`, CSS variable mode
- Base color: `neutral`
- Pre-installed: `Button`, `Card`

## Prisma Schema

Models use `m` for length units and `kg` for weight.

```prisma
model Container {
  id         String      @id @default(cuid())
  name       String
  length     Float       // m
  width      Float       // m
  height     Float       // m
  maxWeight  Float       // kg
  cargoItems CargoItem[]
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
}

model CargoItem {
  id          String    @id @default(cuid())
  name        String
  length      Float     // m
  width       Float     // m
  height      Float     // m
  weight      Float     // kg
  quantity    Int       @default(1)
  container   Container? @relation(fields: [containerId], references: [id])
  containerId String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

Container ↔ CargoItem: optional one-to-many (cargo can exist independently).

## Root Layout

- Google Font: **Inter** with latin subset
- HTML `lang="zh-CN"`
- Metadata: title "Container Loading Simulator"
- `globals.css` imports Tailwind directives + Shadcn CSS custom properties

## Conventions

- Component files: `PascalCase.tsx`
- Utility/config files: `kebab-case.ts`
- Import order: React → Next.js → third-party → internal (`@/`) → types
- Each feature module under `features/` is self-contained (components, hooks, types, services)
- All components use `export default function` declaration
- Explicit return types on exported functions, inferred elsewhere

## Deliverables

1. Complete directory structure
2. All installation commands (documented)
3. All configuration files (written to disk)
4. Initialization code (layout, page, prisma client, utils)
