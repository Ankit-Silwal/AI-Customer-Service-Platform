# AI Customer Service Platform (Warmdesk)

Monorepo (Turborepo): identity, workspace, knowledge, RAG (Python), conversation,
ticket, notification, analytics, API gateway, and Next.js web. Full details: [`docs/`](docs/README.md).

## Services

### Identity Service — `:8000`
- Handles registration, OTP verification, login, logout, and session management.
- Public routes are mounted under `/api`.
- Provides a trusted internal user lookup for downstream services.
- Database: PostgreSQL (`identity_db`)
- Session store: Redis

### Workspace Service — `:7999`
- Manages workspaces, members, invitations, roles, permissions, and audit records.
- Exposes the workspace API under `/api`.
- Validates user existence through the identity service.
- Database: PostgreSQL (`workplace`)

### Knowledge Service — `:7998`
- Manages knowledge sources and attached documents for AI-enabled workflows.
- Stores source metadata and document records for a workspace.
- Uploads files to private Supabase storage, enqueues BullMQ ingestion jobs.
- Database: PostgreSQL (`knowledge_db`)

### RAG Service (Python) — `:8001`
- Chunking, OpenAI embeddings, Qdrant vectors, cited answers. See [`docs/04-rag.md`](docs/04-rag.md).

### Conversation (`:3004`) · Ticket (`:3005`) · Notification (`:3006`) · Analytics (`:3007`)

### API Gateway — `:8080` · Web — `:3000`

Start here: [`docs/12-runbook.md`](docs/12-runbook.md) · test everything: [`docs/11-testing.md`](docs/11-testing.md) · env names: [`ENV.md`](ENV.md).

---

## Architecture

```text
Client
  |
  v
Workspace Service
  |\
  | \__ validates users through Identity Service
  |
  +--> Knowledge Service

Identity Service
  +--> PostgreSQL
  +--> Redis

Workspace Service
  +--> PostgreSQL

Knowledge Service
  +--> PostgreSQL
```

The services are intentionally split so each domain keeps its own Prisma schema, migrations, and runtime responsibilities.

---

## Monorepo Layout

```text
apps/
  identity_service/
  workspace_service/
  knowledge_service/
packages/
  ui/
  eslint-config/
  typescript-config/
```

---

## Local Setup

### Infrastructure

```bash
docker compose up -d
```

This starts:
- PostgreSQL at `localhost:5555`
- Redis at `localhost:6666`
- Qdrant at `localhost:6333`

### Install dependencies

```bash
npm install
```

### Run individual services

```bash
cd apps/identity_service
npm run dev
```

```bash
cd apps/workspace_service
npm run dev
```

```bash
cd apps/knowledge_service
npm run dev
```

---

## Documentation

- Identity service: see [apps/identity_service/README.md](apps/identity_service/README.md)
- Workspace service: see [apps/workspace_service/README.md](apps/workspace_service/README.md)
- Knowledge service: see [apps/knowledge_service/README.md](apps/knowledge_service/README.md)

---

## Notes

- Prisma generation is done per app.
- Environment variables and database configuration are service-specific.
- Internal service calls should be network-restricted before production deployment.
