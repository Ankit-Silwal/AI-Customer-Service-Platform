# 08 · Analytics Service — “What is happening?”

`apps/analytics_service` · Express + Prisma · `analytics_db` · **port 3007**

Event-sourced metrics. Services emit lightweight events; analytics never reads
another database.

## Data

- `MetricEvent { workspaceId, type, createdAt }` — indexed `(workspaceId, type, createdAt)`.

Known types: `ai.answered`, `message.sent`, `ticket.escalated`, `ticket.resolved`
(anything else is counted generically).

## Endpoints (root-mounted)

`POST /events {workspaceId, type}` → `202` event ·
`GET /metrics?workspaceId=` → `{workspaceId, total, counts{type: n}}`.

Frontend reads self-serve rate as `ai.answered` vs `ticket.escalated`.

## Env names

`DATABASE_URL` (…/analytics_db), `INTERNAL_API_TOKEN`, `PORT=3007`.
