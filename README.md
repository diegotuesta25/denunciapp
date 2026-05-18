# DenunciApp

> A modern, citizen-first police complaint platform for Peru — built as a portfolio project to demonstrate what transparent, tamper-evident civic infrastructure could look like.

**Live demo → [URL]**
&nbsp;·&nbsp;
**[GitHub](https://github.com/diegotuesta25/denunciapp)**
&nbsp;·&nbsp;
Built by [Diego Tuesta](https://diegotuesta.site)

---

## What is this?

Peru's official complaint system, SIDPOL, classified all its data as reserved in August 2025, removing public access to information that should be transparent. DenunciApp is a portfolio project that proposes an alternative model:

- Citizens file complaints from their phone, no in-person visit required
- Every action on a complaint is cryptographically hash-chained, tampering is publicly detectable
- Anonymized statistics are open to everyone, by district and crime type

This is **not** a real PNP system. All data is synthetic. There are no real government integrations.

---

## Demo

**Live → [URL]**

Two flows are available without any setup:

| Flow                                                            | How to access                              |
| --------------------------------------------------------------- | ------------------------------------------ |
| **Citizen** - file a complaint, get a tracking code             | Click "Registrar denuncia" on the homepage |
| **Officer console** - view complaints, add notes, update status | Click "Ingresar" → one-click demo login    |

> The demo officer role is `Suboficial`. Comisario and Internal Affairs roles exist in the schema and RBAC but their UI is intentionally minimal, the demo focuses on the citizen and officer flows.

---

## Technical highlights

### Hash-chained audit log

Every event on a complaint (created, status change, note, evidence upload) is stored as an append-only row in `complaintEvents`. Each row's SHA-256 hash is computed over the previous row's hash, forming a chain. A DB trigger blocks `UPDATE` and `DELETE` on this table. The `/verificar` page lets anyone recompute the chain from scratch and confirm nothing has been altered.

### Pure TypeScript state machine

Complaint status transitions are enforced by a zero-dependency state machine in `src/server/domain/`. Each transition is role-gated, an officer can't archive a complaint that hasn't been investigated, and a citizen can't transition anything. The state machine is pure functions with no framework coupling, which made it straightforward to test in isolation.

### `Result<T>` pattern on every Server Action

Every Server Action returns `{ success: true; data: T } | { success: false; error: AppError }`. Raw errors never reach the client. This made error handling consistent across the entire app and easy to assert in tests.

### Test coverage

- **Vitest + React Testing Library** - 92.85% branch coverage on domain logic (state machine, audit chain, Zod schemas), enforced via coverage thresholds in `vitest.config.ts`
- **Playwright E2E** - citizen happy path, officer login + list, note and status flows
- **axe-core** - WCAG 2 AA accessibility audit on all public and officer pages, all violations fixed

---

## Stack

| Layer            | Choice                               |
| ---------------- | ------------------------------------ |
| Framework        | Next.js (App Router)                 |
| Language         | TypeScript (strict)                  |
| Styling          | Tailwind CSS v4 + shadcn/ui          |
| Forms            | React Hook Form + Zod                |
| ORM              | Drizzle ORM                          |
| Database         | PostgreSQL + PostGIS on Neon         |
| Auth             | Auth.js v5 - magic links via Resend  |
| File storage     | Vercel Blob                          |
| Rate limiting    | Upstash Redis                        |
| Maps             | MapLibre GL + OpenStreetMap          |
| Error monitoring | Sentry                               |
| Testing          | Vitest + RTL + Playwright + axe-core |
| Hosting          | Vercel                               |

---

## Running locally

```bash
# Clone
git clone https://github.com/diegotuesta25/denunciapp.git
cd denunciapp

# Install
pnpm install

# Environment variables
# Copy .env.example and fill in the required values
cp .env.example .env.local

# Run
pnpm dev
```

Required environment variables: `DATABASE_URL`, `NEXTAUTH_SECRET`, `RESEND_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `NEXT_PUBLIC_DEMO_MODE=true`.

---

## What's intentionally out of scope

This is a solo portfolio project built in ~18 days. The following are real architectural decisions, not overlooked features:

- **Comisario / Internal Affairs UI** — the roles and RBAC exist; the UI is minimal. The demo exposes the officer role only.
- **Real PNP integration** — no real government API connections; all data is synthetic.
- **Email magic links** — Resend free tier only sends to one verified email, so the demo uses a one-click credentials login instead.
- **Virus scanning on evidence uploads** — the `onUploadCompleted` callback doesn't fire locally; designed for Phase 2.

---

## Project structure

```
src/
  app/                  ← Next.js App Router pages
  server/
    actions/            ← Server Actions ("use server")
    domain/             ← Pure TS: state machine, audit chain
  components/
    shared/             ← Forms, evidence, filters
    officer/            ← Officer console components
    dashboard/          ← Map + charts
  lib/
    db/                 ← Drizzle schema + client
    result.ts           ← Result<T> pattern
    validations/        ← Zod schemas
```

---

_DenunciApp, portfolio project by Diego Tuesta. Not an official PNP system._
