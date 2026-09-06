# RAG Service (Python + Qdrant)

Canonical RAG pipeline. Node `knowledge_service` owns CRUD + file upload;
this service owns chunk/embed/search/answer.

## Run

```bash
cd apps/rag_service
cp .env.example .env
pip install -r requirements.txt
uvicorn app.main:app --port 8001
```

Needs: Qdrant at `QDRANT_URL` (`docker compose up -d qdrant_db`),
Supabase bucket for originals, `OPENAI_API_KEY`.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Health + collection name |
| POST | `/ingest` | Queue ingest (BackgroundTask) `{documentId, sourceId, workspaceId, storageKey, filename}` |
| POST | `/ingest/sync` | Ingest inline (returns chunk count) |
| POST | `/query` | `{question, workspaceId, topK}` -> `{answer, sources[]}` |
| DELETE | `/documents/{documentId}` | Remove Qdrant points for a document |

Flow: Node uploads to Supabase + creates `Document(UPLOADED)` then
`POST /ingest`. Worker downloads, extracts (PDF/DOCX/TXT), chunks
(1000/200), embeds (`text-embedding-3-small`), upserts to Qdrant
collection `knowledge_chunks` with payload
`{workspaceId, sourceId, documentId, filename, chunkIndex, content}`,
flips Postgres status `PROCESSING -> READY/FAILED`.
Query embeds the question, filters by `workspaceId`, answers with
`gpt-4o-mini` + `[1]` citations.
