# 05 · Conversation Service — “What was said?”

`apps/conversation_service` · Express + Prisma · `conversation_db` · **port 3004**

Stores history only. AI orchestration happens in the caller (web/gateway):
ask RAG, then persist the reply as an `AI` message. Escalation = creating a
ticket (ticket service) and marking the chat `WAITING`.

## Data

- `Conversation { id, workspaceId, customerId, status: OPEN|WAITING|RESOLVED|CLOSED, assignedAgentId?, … }` — indexed `(workspaceId, status)`
- `Message { conversationId → cascade, senderType: CUSTOMER|AI|AGENT|SYSTEM, senderId?, content(≤10000) }` — posting bumps `conversation.updatedAt` in the same transaction.

## Endpoints (under `/conversations`)

`POST /` `{workspaceId,customerId}` · `GET /?workspaceId=` (latest 100) ·
`GET|PATCH(status|assignedAgentId) /:id` ·
`GET /:id/messages` (500, chronological) · `POST /:id/messages` `{senderType,senderId?,content}`.

## Frontend flow

Open chat → customer message → `POST /api/rag/query` → store AI reply →
(optionally) `POST /api/tickets` + `PATCH` chat `WAITING`. Chat page polls
messages every 5s (WebSockets deferred).

## Env names

`DATABASE_URL` (…/conversation_db), `REDIS_URL`, `RAG_SERVICE_URL`,
`WORKSPACE_SERVICE_URL`, `INTERNAL_API_TOKEN`, `PORT=3004`.
