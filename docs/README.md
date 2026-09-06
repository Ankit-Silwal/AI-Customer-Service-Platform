# Warmdesk — AI Customer Service Platform (docs index)

A Turborepo monorepo. Each service owns its domain, its database, and its lifecycle.
No service reads another service's database — cross-service facts travel over
`GET /internal/*` HTTP or async jobs.

```
Browser (Next.js :3000)
  └─→ API Gateway :8080  (routing, request-id, cookie + x-user-id propagation)
        ├─ Identity :8000 ──→ identity_db + Redis (sessions, OTP)
        ├─ Workspace :7999 ──→ workspace_db (+ calls Identity /internal/users/:id)
        ├─ Knowledge :7998 ──→ knowledge_db + Supabase (files) + Redis/BullMQ
        ├─ RAG (Python) :8001 ──→ Qdrant (vectors) + Supabase (reads files)
        ├─ Conversation :3004 ──→ conversation_db
        ├─ Ticket :3005 ──→ ticket_db
        ├─ Notification :3006 ──→ SMTP (Gmail) / dev log
        └─ Analytics :3007 ──→ analytics_db (event-sourced metrics)
```

Shared infra (`docker-compose.yml`): Postgres `:5555`, Redis `:6666`, Qdrant `:6333`.

## Port map (live values — keep in sync with each service `.env`)

| Service | Port | Database |
|---|---|---|
| identity_service | 8000 | identity_db |
| workspace_service | 7999 (hardcoded) | workplace |
| knowledge_service | 7998 | knowledge_db |
| rag_service | 8001 | — (stateless; optional status write) |
| conversation_service | 3004 | conversation_db |
| ticket_service | 3005 | ticket_db |
| notification_service | 3006 | notification_db |
| analytics_service | 3007 | analytics_db |
| api_gateway | 8080 | — |
| web | 3000 | — |

## Files

| Doc | Covers |
|---|---|
| [01-identity](01-identity.md) | Registration, OTP, sessions, profiles |
| [02-workspace](02-workspace.md) | Workspaces, roles, invitations, audit |
| [03-knowledge](03-knowledge.md) | Sources, documents, upload, ingestion queue |
| [04-rag](04-rag.md) | Python chunk/embed/search pipeline, Qdrant |
| [05-conversation](05-conversation.md) | Chats, messages, AI answers, escalation |
| [06-ticket](06-ticket.md) | Human queue, assignment, notes |
| [07-notification](07-notification.md) | Email fan-out |
| [08-analytics](08-analytics.md) | Event metrics |
| [09-gateway](09-gateway.md) | Routing table, auth propagation, multipart |
| [10-web](10-web.md) | Next.js pages and flows |
| [11-testing](11-testing.md) | curl suite for every endpoint, in order |
| [12-runbook](12-runbook.md) | Start order, migrations, troubleshooting |

Env reference (names only, never values): see root `ENV.md`.
