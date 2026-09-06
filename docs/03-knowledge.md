# 03 · Knowledge Service — “What knowledge belongs to this workspace?”

`apps/knowledge_service` · Express + Prisma + Multer + Supabase + BullMQ · **port 7998**

Owns sources, document metadata, upload validation, storage layout, ingestion jobs.
Does **not** own embeddings, retrieval or LLM answers (that's RAG).

## Data (`knowledge_db`)

- `KnowledgeSource { id, workspaceId, name, type: PDF|DOCX|WEBSITE|FAQ }`
- `Document { id, sourceId → cascade, filename, storageKey, status: UPLOADED|PROCESSING|READY|FAILED }`

## Upload pipeline (only happy path creates records)

```
POST /knowledge/documents (multipart: sourceId + file)
  → Multer: ≤10MB, MIME+extension ∈ {pdf,docx,txt,md}
  → Zod: sourceId must be UUID
  → source lookup FIRST (fail fast, no orphan upload)
  → Supabase private bucket `knowledge_service`:
      workspaces/{workspaceId}/documents/{uuid}-{sanitized-name}
  → Prisma Document(UPLOADED)
  → BullMQ `document-processing` enqueue (jobId=documentId, 3 attempts)
  → 201 { document }            ← HTTP ends here
  → worker: PROCESSING → POST rag /ingest/sync → READY|FAILED
```

DB-write failure after upload triggers orphan cleanup (`deleteFile`).
Direct RAG HTTP is the fallback only if Redis is down.

## Endpoints (under `/knowledge`)

Sources: `POST /sources {workspaceId,name,type}` · `GET /sources?workspaceId=` ·
`GET|PATCH(name)|DELETE /sources/:sourceId` (delete cleans vectors + files per doc, then cascades).
Documents: `POST /documents` (multipart) · `GET /documents?sourceId=` ·
`GET|DELETE /documents/:documentId` (delete removes Qdrant points + object + row).

## Workers

- `src/workers/ingestion.worker.ts` — canonical. `npm run worker`. Concurrency 2.
- `src/workers/document.processor.ts` — **deprecated** (`ts-nocheck`), kept for reference.

## Env names

`DATABASE_URL` (…/knowledge_db), `REDIS_URL`, `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET=knowledge_service`,
`RAG_SERVICE_URL=http://localhost:8001`, `WORKSPACE_SERVICE_URL`,
`INTERNAL_API_TOKEN`, `PORT=7998`.

## Failure modes

- Wrong MIME/extension or >10MB → 400 before any upload.
- Unknown `sourceId` → 400, nothing uploaded.
- RAG/Qdrant down → doc stays `UPLOADED`, retries 3×, then `FAILED` (re-upload or re-enqueue to retry).
