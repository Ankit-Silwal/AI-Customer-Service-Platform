# 09 · API Gateway — single public entry (`:8080`)

`apps/api_gateway` · Express, zero business logic. Routing + `x-request-id` +
cookie/`x-user-id` propagation + JSON error shape.

## Routing (prefix → upstream + base-path fix)

| Browser | Upstream |
|---|---|
| `/api/identity/*` | `IDENTITY_URL/api/*` |
| `/api/workspaces/*`, `/api/invitations/*`, `/api/internal*` | `WORKSPACE_URL/api/*` |
| `/api/knowledge/*` | `KNOWLEDGE_URL/knowledge/*` |
| `/api/rag/query`, `/ingest*` | `RAG_URL/query`, `/ingest*` |
| `/api/rag/search` | `RAG_URL/rag/search` |
| `/api/rag/documents/*` | `RAG_URL/documents/*` |
| `/api/conversations*` | `CONVERSATION_URL/conversations*` |
| `/api/tickets*` | `TICKET_URL/tickets*` |
| `/api/notifications*` | `NOTIFICATION_URL/notifications*` |
| `/api/analytics/*` | `ANALYTICS_URL/*` (i.e. `/events`, `/metrics`) |

## Auth propagation

Forwards the browser `sessionId` cookie untouched, then resolves the user via
`IDENTITY_URL/api/auth/me` (5s timeout) and injects `x-user-id` — so workspace
calls work on login alone and services never trust client-supplied ids.
Adds `x-internal-token` when `INTERNAL_API_TOKEN` is set. Unknown routes → 404,
upstream failures → 502, all with `requestId`.

## Multipart

`express.json()` is skipped for `multipart/*`; the raw stream is proxied with
`duplex: half` + original content headers — file uploads pass through byte-identical.

## Env names

`PORT=8080`, `IDENTITY_URL` (:8000), `WORKSPACE_URL` (:7999),
`KNOWLEDGE_URL` (:7998), `RAG_URL` (:8001), `CONVERSATION_URL` (:3004),
`TICKET_URL` (:3005), `NOTIFICATION_URL` (:3006), `ANALYTICS_URL` (:3007),
`INTERNAL_API_TOKEN`.
