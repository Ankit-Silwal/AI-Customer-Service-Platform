# 11 · Testing guide (curl, gateway-first)

Use the gateway so you test the real path. `curl -c jar -b jar` keeps the session cookie.

```bash
BASE=http://localhost:8080
```

## 0 · Health (expect `{"status":"ok"}` each)

```bash
for p in identity workspaces knowledge rag conversations tickets notifications analytics; do
  curl -s $BASE/api/$p/health 2>/dev/null || curl -s $BASE/health; echo;
done
# direct RAG + services:
curl -s http://localhost:8001/health; echo
curl -s http://localhost:8000/api/health; echo
```

## 1 · Identity

```bash
# register (note conformPassword) → capture user.id
curl -s -X POST $BASE/api/identity/auth/register \
 -H 'content-type: application/json' \
 -d '{"name":"Ada","email":"ada@example.com","password":"StrongPass123!","conformPassword":"StrongPass123!"}'
# check the Gmail inbox for the OTP, then (USER_ID from above):
curl -s -X POST $BASE/api/identity/auth/verify-otp \
 -H 'content-type: application/json' -d '{"userId":"<USER_ID>","otp":"<CODE>"}'
# login (stores cookie in jar):
curl -s -c jar -b jar -X POST $BASE/api/identity/auth/login \
 -H 'content-type: application/json' -d '{"email":"ada@example.com","password":"StrongPass123!"}'
# me (expect your user):
curl -s -b jar $BASE/api/identity/auth/me
```

Negative: login before verify → 400 “verify your email”; wrong OTP → 400; no cookie on `/me` → 401.

## 2 · Workspace

```bash
# create (expect workspace + you as OWNER):
curl -s -b jar -X POST $BASE/api/workspaces/workspaces \
 -H 'content-type: application/json' -d '{"name":"Support Ops"}'   # → WS_ID
curl -s -b jar $BASE/api/workspaces/workspaces                      # list mine
curl -s -b jar $BASE/api/workspaces/workspaces/<WS_ID>              # detail
curl -s -b jar -X PATCH $BASE/api/workspaces/workspaces/<WS_ID> \
 -H 'content-type: application/json' -d '{"name":"Support Org"}'
# members / invitations (INVITED_ID = second user's id):
curl -s -b jar $BASE/api/workspaces/workspaces/<WS_ID>/members
curl -s -b jar -X POST $BASE/api/workspaces/workspaces/<WS_ID>/invitations \
 -H 'content-type: application/json' -d '{"userId":"<INVITED_ID>","role":"AGENT"}'  # → INV_ID
curl -s -b jar $BASE/api/workspaces/workspaces/<WS_ID>/invitations
# as invited user (their jar): accept then list:
curl -s -b jar2 -X POST $BASE/api/workspaces/invitations/<INV_ID>/accept
curl -s -b jar -X PATCH $BASE/api/workspaces/workspaces/<WS_ID>/members/<INVITED_ID>/role \
 -H 'content-type: application/json' -d '{"role":"ADMIN"}'
```

## 3 · Knowledge

```bash
# source:
curl -s -X POST $BASE/api/knowledge/sources -H 'content-type: application/json' \
 -d '{"workspaceId":"<WS_ID>","name":"Refund docs","type":"PDF"}'   # → SRC_ID
curl -s "$BASE/api/knowledge/sources?workspaceId=<WS_ID>"
# upload (multipart!):
curl -s -X POST $BASE/api/knowledge/documents \
 -F "sourceId=<SRC_ID>" -F "file=@./sample.pdf"                     # → 201 UPLOADED
# poll until READY (worker + RAG running):
watch -n 3 "curl -s $BASE/api/knowledge/documents/<DOC_ID>"
curl -s "$BASE/api/knowledge/documents?sourceId=<SRC_ID>"
```

Negative: `.exe` file → 400; bad UUID → 400; unknown source → 400 with nothing uploaded.

## 4 · RAG (direct, needs OPENAI_API_KEY + Qdrant up)

```bash
curl -s -X POST http://localhost:8001/query -H 'content-type: application/json' \
 -d '{"question":"What is the refund policy?","workspaceId":"<WS_ID>","topK":5}'
# spec shape:
curl -s -X POST http://localhost:8001/rag/search -H 'content-type: application/json' \
 -d '{"workspaceId":"<WS_ID>","query":"refund policy","topK":5}'
```

Expect `sources[]` with `documentId/score`, each from **your** workspace only.

## 5 · Conversations

```bash
curl -s -b jar -X POST $BASE/api/conversations -H 'content-type: application/json' \
 -d '{"workspaceId":"<WS_ID>","customerId":"cust-1"}'                # → CONV_ID
curl -s -b jar -X POST $BASE/api/conversations/<CONV_ID>/messages \
 -H 'content-type: application/json' -d '{"senderType":"CUSTOMER","content":"Where is my refund?"}'
# AI answer loop (manual orchestration):
curl -s -X POST $BASE/api/rag/query -H 'content-type: application/json' \
 -d '{"question":"Where is my refund?","workspaceId":"<WS_ID>"}'    # copy .answer
curl -s -b jar -X POST $BASE/api/conversations/<CONV_ID>/messages \
 -H 'content-type: application/json' -d '{"senderType":"AI","content":"<ANSWER>"}'
curl -s -b jar $BASE/api/conversations/<CONV_ID>/messages
```

## 6 · Tickets

```bash
curl -s -b jar -X POST $BASE/api/tickets -H 'content-type: application/json' \
 -d '{"workspaceId":"<WS_ID>","conversationId":"<CONV_ID>","title":"Refund missing","priority":"HIGH"}'  # → T_ID
curl -s -b jar "$BASE/api/tickets?workspaceId=<WS_ID>"
curl -s -b jar -X POST $BASE/api/tickets/<T_ID>/assign -H 'content-type: application/json' -d '{"assigneeId":"<USER_ID>"}'
curl -s -b jar -X POST $BASE/api/tickets/<T_ID>/notes -H 'content-type: application/json' -d '{"authorId":"<USER_ID>","content":"Called customer, confirmed."}'
curl -s -b jar -X POST $BASE/api/tickets/<T_ID>/resolve
curl -s -b jar $BASE/api/tickets/<T_ID>   # status RESOLVED + notes
```

## 7 · Notifications & analytics

```bash
curl -s -X POST $BASE/api/notifications -H 'content-type: application/json' \
 -d '{"type":"ticket","to":"agent@example.com","subject":"Assigned","text":"Ticket <T_ID> is yours"}'  # 202
curl -s -X POST $BASE/api/analytics/events -H 'content-type: application/json' \
 -d '{"workspaceId":"<WS_ID>","type":"ai.answered"}'
curl -s "$BASE/api/analytics/metrics?workspaceId=<WS_ID>"   # {total, counts}
```

## Cleanup order (FK-safe)

messages ⊂ conversation ⊂ ticket(note) — delete tickets first, then
conversations, then knowledge docs/sources, then workspace (cascades members/invites).
