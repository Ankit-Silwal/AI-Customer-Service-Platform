# Conversation Service

Owns conversations + messages. AI orchestration calls `rag_service` then stores
the AI reply here via `POST /conversations/:id/messages {senderType:"AI"}`.
Escalation creates a ticket in `ticket_service` (by caller, not here).

Run: `npx prisma migrate dev`, `npm run dev`. Health: `GET /health`.
