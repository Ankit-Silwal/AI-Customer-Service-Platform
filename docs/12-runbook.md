# 12 · Runbook — from zero to working demo

## Prereqs

Node ≥18, npm 11, Docker, Python 3.11+ (RAG only), a Supabase project (private
bucket `knowledge_service`), Gmail app password (identity + notifications), fresh
`OPENAI_API_KEY` for `apps/rag_service/.env`.

## 1 · Infra

```bash
docker compose up -d
# Postgres :5555 (identity_db + workplace, workspace_db… via docker/init-db.sql)
# Redis    :6666
# Qdrant   :6333
```

## 2 · Install (per service with `package.json`, or root workspace install)

```bash
# e.g.
cd apps/conversation_service && npm install --no-audit --no-fund
```

> Fixed 2026-09: removed dead `@types/mammoth` (404 on the registry) that broke installs.

## 3 · Env

Every service reads its own `.env` **by absolute path from its entry file**, so
services start from any cwd (turbo, IDE tasks, terminal). Verify parsing with:

```bash
node -e "require('dotenv').config({path:'apps/<svc>/.env'});console.log(!!process.env.DATABASE_URL)"
```

Key names per service: root `ENV.md`. Live ports: identity 8000, workspace 7999,
knowledge 7998, rag 8001, conversation 3004, ticket 3005, notification 3006,
analytics 3007, gateway 8080, web 3000.

## 4 · Databases (one per service, same container)

```bash
npx prisma migrate dev --schema apps/identity_service/prisma/schema.prisma
npx prisma migrate dev --schema apps/workspace_service/prisma/schema.prisma
npx prisma migrate dev --schema apps/knowledge_service/prisma/schema.prisma
npx prisma migrate dev --schema apps/conversation_service/prisma/schema.prisma
npx prisma migrate dev --schema apps/ticket_service/prisma/schema.prisma
npx prisma migrate dev --schema apps/analytics_service/prisma/schema.prisma
# generate only: npx prisma generate (each service)
```

## 5 · Start order

```bash
npm run dev                      # turbo: all Node services (use --filter to pick)
cd apps/knowledge_service && npm run worker   # ingestion worker (separate terminal)
cd apps/rag_service && uvicorn app.main:app --port 8001
cd apps/web && npm run dev       # :3000
```

## 6 · Smoke test

Follow [11-testing](11-testing.md) §0–§1. Then the golden path: register →
verify → login → workspace → source → upload → poll READY → query → chat →
escalate → resolve → metrics.

## Troubleshooting

| Symptom | Cause → fix |
|---|---|
| `Error: DATABASE_URL is not set` at startup | Old entry loaded `.env` from cwd. Fixed: entries now resolve `.env` by file path. Pull latest `index.ts`/`server.ts`. |
| `tsx: not recognized` | Run `npm install` in that service first. |
| Prisma `P1012 enum` errors | Enums must be one value per line; Prisma 7 has no `url` in schema (see ticket fix). |
| `exactOptionalPropertyTypes` vs Zod (`p.data`) | Accept `\| undefined` in repo params, strip `undefined` keys before Prisma create/update. |
| Upload → `FAILED`, never READY | RAG down / no `OPENAI_API_KEY` / Qdrant down. Check `:8001/health`, key, `:6333/dashboard`. |
| Workspace calls 401 from browser | Gateway injects `x-user-id` from the session cookie — ensure gateway `.env` `IDENTITY_URL=http://localhost:8000` and you hit the gateway, not services directly. |
| No OTP email | Gmail USER/PASS in identity `.env`; app password, not account password. |
| Port clash on 8000 | Identity owns 8000; workspace is hardcoded 7999 (its `.env` PORT is unused). |
