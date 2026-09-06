"""Minimal Postgres helper: flip knowledge_service Document.status.

Keeps Node/Prisma as the owner of the table; Python only updates status.
Table: "Document" (id TEXT PK, status "DocumentStatus" enum).
"""
from __future__ import annotations

import psycopg

from app.config.settings import settings


def set_document_status(document_id: str, status: str) -> None:
    if not settings.DATABASE_URL:
        return  # dev w/o DB: skip silently, Qdrant is source of vectors
    if status not in ("UPLOADED", "PROCESSING", "READY", "FAILED"):
        raise ValueError(f"bad status {status}")
    with psycopg.connect(settings.DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute(
                'UPDATE "Document" SET status = %s::"DocumentStatus", "updatedAt" = NOW() WHERE id = %s',
                (status, document_id),
            )
        conn.commit()
