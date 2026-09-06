# 06 · Ticket Service — “Who handles what?”

`apps/ticket_service` · Express + Prisma · `ticket_db` · **port 3005**

Human queue for AI escalations. Single-file app (`src/app.ts`) — pure CRUD,
no cross-service calls.

## Data

- `Ticket { workspaceId, conversationId?, title, description?, status: OPEN|IN_PROGRESS|WAITING|RESOLVED|CLOSED, priority: LOW|MEDIUM|HIGH|URGENT, assigneeId? }`
- `TicketNote { ticketId → cascade, authorId, content }`

## Endpoints (root-mounted)

`POST /tickets {workspaceId, conversationId?, title, description?, priority}` ·
`GET /tickets?workspaceId=` · `GET /tickets/:id` (with notes) ·
`PATCH /tickets/:id {status?,priority?,assigneeId?}` ·
`POST /tickets/:id/assign {assigneeId}` (also → IN_PROGRESS) ·
`POST /tickets/:id/notes {authorId, content}` · `POST /tickets/:id/resolve`.

Strict TS note: optional Zod fields carry `| undefined`; the repository strips
`undefined` keys before Prisma calls (required under `exactOptionalPropertyTypes`).

## Env names

`DATABASE_URL` (…/ticket_db), `WORKSPACE_SERVICE_URL`, `CONVERSATION_SERVICE_URL`,
`INTERNAL_API_TOKEN`, `PORT=3005`.
