# AI Customer Service Platform

This monorepo contains three backend services that work together to support identity, workspace collaboration, and knowledge management for an AI customer service platform.

## Services

### Identity Service
- Handles registration, OTP verification, login, logout, and session management.
- Public routes are mounted under `/api`.
- Provides a trusted internal user lookup for downstream services.
- Database: PostgreSQL
- Session store: Redis
- Default port: `4000`

### Workspace Service
- Manages workspaces, members, invitations, roles, permissions, and audit records.
- Exposes the workspace API under `/api`.
- Validates user existence through the identity service.
- Database: PostgreSQL
- Default port: `7999`

### Knowledge Service
- Manages knowledge sources and attached documents for AI-enabled workflows.
- Stores source metadata and document records for a workspace.
- Database: PostgreSQL
- Port: configured via `PORT`

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
