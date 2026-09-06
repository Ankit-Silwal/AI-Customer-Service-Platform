# Environment variables (fill these in — never commit real `.env` files)

Copy each `.env.example` to `.env` inside the service folder and fill values.
All URLs below default to localhost for dev. Only `docker-compose.yml` ports are fixed.

## Shared infra (root `docker-compose.yml`)

| Var | Default | Where |
|---|---|---|
| `POSTGRES_URL` / per-service `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5555/<db>` | each Node service |
| `REDIS_URL` | `redis://localhost:6666` | identity, knowledge, notification, conversation |
| `QDRANT_URL` | `http://localhost:6333` | rag_service (`QDRANT_URL`), knowledge (`RAG_SERVICE_URL` points to Python, not Qdrant directly) |

Postgres container creates via `docker/init-db.sql`:
`identity_db, workspace_db, knowledge_db, conversation_db, ticket_db, analytics_db, notification_db`.

## identity_service (`apps/identity_service/.env`)

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5555/identity_db
REDIS_CLIENT_URL=redis://localhost:6666
SMTP_USER= (gmail address)
SMTP_PASS= (gmail app password)
PORT=8000
```

## workspace_service (`apps/workspace_service/.env`)

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5555/workspace_db
IDENTITY_SERVICE_URL=http://localhost:4000
INTERNAL_API_TOKEN=<shared-random-string>
PORT=7999
```

## knowledge_service (`apps/knowledge_service/.env`)

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5555/knowledge_db
REDIS_URL=redis://localhost:6666
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_BUCKET=knowledge_service
RAG_SERVICE_URL=http://localhost:8001
WORKSPACE_SERVICE_URL=http://localhost:7999
INTERNAL_API_TOKEN=<shared-random-string>
PORT=7998
```

## rag_service (`apps/rag_service/.env`)

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_BUCKET=knowledge_service
OPENAI_API_KEY=   # fresh key required (never reuse an exposed one)
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=knowledge_chunks
DATABASE_URL=postgresql://postgres:postgres@localhost:5555/knowledge_db  # optional, only flips Document.status; leave empty to keep Python stateless
PORT=8001
```

## conversation_service (`apps/conversation_service/.env`)

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5555/conversation_db
REDIS_URL=redis://localhost:6666
RAG_SERVICE_URL=http://localhost:8001
WORKSPACE_SERVICE_URL=http://localhost:7999
INTERNAL_API_TOKEN=<shared-random-string>
PORT=3004
```

## ticket_service (`apps/ticket_service/.env`)

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5555/ticket_db
WORKSPACE_SERVICE_URL=http://localhost:7999
CONVERSATION_SERVICE_URL=http://localhost:3004
INTERNAL_API_TOKEN=<shared-random-string>
PORT=3005
```

## notification_service (`apps/notification_service/.env`)

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5555/notification_db
REDIS_URL=redis://localhost:6666
SMTP_HOST= / SMTP_PORT= / SMTP_USER= / SMTP_PASS= / SMTP_FROM=
INTERNAL_API_TOKEN=<shared-random-string>
PORT=3006
```

## analytics_service (`apps/analytics_service/.env`)

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5555/analytics_db
INTERNAL_API_TOKEN=<shared-random-string>
PORT=3007
```

## api_gateway (`apps/api_gateway/.env`)

```
PORT=8080
IDENTITY_URL=http://localhost:8000
WORKSPACE_URL=http://localhost:7999
KNOWLEDGE_URL=http://localhost:7998
RAG_URL=http://localhost:8001
CONVERSATION_URL=http://localhost:3004
TICKET_URL=http://localhost:3005
NOTIFICATION_URL=http://localhost:3006
ANALYTICS_URL=http://localhost:3007
INTERNAL_API_TOKEN=<shared-random-string>
```

## web (`apps/web/.env.local`)

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Rules

- One `.env` per service. Root has no `.env`.
- `INTERNAL_API_TOKEN` must match across services that call `/internal/*`.
- Never commit `.env`. Only `.env.example` files are committed.
- Supabase bucket `knowledge-docs` must be **private**.
