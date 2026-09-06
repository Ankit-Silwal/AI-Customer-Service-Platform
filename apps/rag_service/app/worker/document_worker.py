"""Ingest worker: Supabase download -> extract -> chunk -> embed -> Qdrant."""
from __future__ import annotations

from supabase import create_client

from app import embeddings as emb
from app import qdrant_store as store
from app.config.settings import settings
from app.db import set_document_status
from app.ingestion.pdf import chunk_text, extract_text


def download_bytes(storage_key: str) -> tuple[bytes, str]:
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError("Supabase env is not set")
    sb = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    data = sb.storage.from_(settings.SUPABASE_BUCKET).download(storage_key)
    if isinstance(data, bytes):
        return data, ""
    # supabase-py may return response-like; best-effort
    content = getattr(data, "content", b"")
    ctype = ""
    headers = getattr(data, "headers", {}) or {}
    if isinstance(headers, dict):
        ctype = str(headers.get("content-type", ""))
    return bytes(content), ctype


def process_document(
    *,
    document_id: str,
    source_id: str,
    workspace_id: str,
    storage_key: str,
    filename: str,
) -> dict:
    set_document_status(document_id, "PROCESSING")
    try:
        raw, ctype = download_bytes(storage_key)
        text = extract_text(raw, filename, ctype)
        chunks = chunk_text(text, settings.CHUNK_SIZE, settings.CHUNK_OVERLAP)[
            : settings.MAX_CHUNKS_PER_DOC
        ]
        if not chunks:
            raise RuntimeError("no text extracted")
        store.ensure_collection()
        vectors = emb.embed_texts(chunks)
        count = store.upsert_chunks(
            workspace_id=workspace_id,
            source_id=source_id,
            document_id=document_id,
            filename=filename,
            chunks=chunks,
            vectors=vectors,
        )
        set_document_status(document_id, "READY")
        return {"documentId": document_id, "chunks": count, "status": "READY"}
    except Exception as exc:
        try:
            set_document_status(document_id, "FAILED")
        except Exception:
            pass
        raise exc
