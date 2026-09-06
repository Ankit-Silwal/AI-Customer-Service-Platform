# 04 · RAG Service — “What do we know about this question?” (Python)

`apps/rag_service` · FastAPI + Qdrant + OpenAI · **port 8001**. The only ML-heavy service.

Stateless by design: owns **vectors only**. Node owns Postgres rows and
`Document.status` (worker flips it around `/ingest/sync`). `DATABASE_URL` left
empty keeps Python fully stateless.

## Pipeline

```
POST /ingest[/sync] {documentId, sourceId, workspaceId, storageKey, filename}
  → download bytes from Supabase bucket
  → extract: PDF (pymupdf), DOCX (python-docx), else UTF-8 decode
  → clean + char-chunk (1000/200 overlap, ≤500 chunks)
  → embed batches (text-embedding-3-small, 1536d)
  → Qdrant upsert (collection `knowledge_chunks`, cosine),
     payload {workspaceId, sourceId, documentId, filename, chunkIndex, content}
     — previous points for documentId deleted first (idempotent re-ingest)
```

## Query

`POST /query {question, workspaceId, topK}` → embed → Qdrant filtered
`workspaceId == …` → `{answer (gpt-4o-mini, cited [1..n]), sources[]}`.
Spec-shaped alias `POST /rag/search {workspaceId, query, topK}` →
`{results[{chunkId, documentId, text, score}]}` (no generated answer).
`DELETE /documents/{documentId}` drops its points. `GET /health` reports the collection.

Workspace isolation is structural: every point carries `workspaceId`, every search
filters on it. RAG never authorizes — callers (gateway/conversation) own access.

## Research

Chunking lives in `app/ingestion/pdf.py:chunk_text`. Tune `CHUNK_SIZE /
CHUNK_OVERLAP / MAX_CHUNKS_PER_DOC` in `app/config/settings.py`; keep
experiments out of `app/main.py` (see project brief §RAG research).

## Env names

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET=knowledge_service`,
`OPENAI_API_KEY` (**required**, fresh key), `QDRANT_URL=http://localhost:6333`,
`QDRANT_COLLECTION=knowledge_chunks`, `DATABASE_URL` (empty = stateless), `PORT=8001`.

Run: `pip install -r requirements.txt` (+`python-docx`, `psycopg[binary]` already appended),
`uvicorn app.main:app --port 8001`.
