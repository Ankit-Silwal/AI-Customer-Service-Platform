"""RAG service entrypoint: ingest (Supabase->Qdrant) + query (Qdrant->LLM)."""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import BackgroundTasks, FastAPI, HTTPException
from pydantic import BaseModel, Field

from app import embeddings as emb
from app import qdrant_store as store
from app.config.settings import settings
from app.worker.document_worker import process_document


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        store.ensure_collection()
    except Exception:
        pass  # Qdrant may start after API; routes retry lazily
    yield


app = FastAPI(title="rag_service", version="1.0.0", lifespan=lifespan)


class IngestRequest(BaseModel):
    documentId: str
    sourceId: str
    workspaceId: str
    storageKey: str
    filename: str


class QueryRequest(BaseModel):
    question: str
    workspaceId: str
    topK: int = Field(default=5, ge=1, le=20)


@app.get("/health")
def health():
    return {"status": "ok", "collection": settings.QDRANT_COLLECTION}


@app.post("/ingest", status_code=202)
def ingest(req: IngestRequest, bg: BackgroundTasks):
    # Trust workspaceId per scope (no membership check).
    bg.add_task(
        process_document,
        document_id=req.documentId,
        source_id=req.sourceId,
        workspace_id=req.workspaceId,
        storage_key=req.storageKey,
        filename=req.filename,
    )
    return {"status": "queued", "documentId": req.documentId}


@app.post("/ingest/sync")
def ingest_sync(req: IngestRequest):
    try:
        return process_document(
            document_id=req.documentId,
            source_id=req.sourceId,
            workspace_id=req.workspaceId,
            storage_key=req.storageKey,
            filename=req.filename,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/query")
def query(req: QueryRequest):
    return _search(workspace_id=req.workspaceId, question=req.question, top_k=req.topK)


class SearchRequest(BaseModel):
    workspaceId: str
    query: str
    topK: int = Field(default=5, ge=1, le=20)


@app.post("/rag/search")
def rag_search(req: SearchRequest):
    """Spec-shaped alias: {workspaceId, query} -> {results[]}. No auth here; callers enforce workspace access."""
    out = _search(workspace_id=req.workspaceId, question=req.query, top_k=req.topK)
    return {
        "results": [
            {
                "chunkId": f"{s['documentId']}:{s.get('chunkIndex', 0)}",
                "documentId": s["documentId"],
                "text": s["content"],
                "score": s["score"],
            }
            for s in out["sources"]
        ]
    }


def _search(*, workspace_id: string, question: string, top_k: int):  # type: ignore[valid-type]
    if not question.strip():
        raise HTTPException(status_code=400, detail="question is required")
    try:
        store.ensure_collection()
        vec = emb.embed_one(question)
        res = store.search(workspace_id=workspace_id, vector=vec, top_k=top_k)
        sources = []
        for p in res.points:
            payload = p.payload or {}
            sources.append(
                {
                    "content": payload.get("content", ""),
                    "score": float(p.score or 0),
                    "documentId": payload.get("documentId", ""),
                    "sourceId": payload.get("sourceId", ""),
                    "filename": payload.get("filename", ""),
                    "chunkIndex": payload.get("chunkIndex", 0),
                }
            )
        answer = emb.chat_answer(question, [s["content"] for s in sources])
        return {"answer": answer, "sources": sources}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.delete("/documents/{document_id}", status_code=200)
def delete_document(document_id: str):
    try:
        store.delete_by_document(document_id)
        return {"status": "deleted", "documentId": document_id}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
