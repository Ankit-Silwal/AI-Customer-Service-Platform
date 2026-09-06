"""Qdrant store: single collection w/ workspace/document filters."""
from __future__ import annotations

import uuid

from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels

from app.config.settings import settings

_client: QdrantClient | None = None


def get_qdrant() -> QdrantClient:
    global _client
    if _client is None:
        _client = QdrantClient(url=settings.QDRANT_URL, api_key=settings.QDRANT_API_KEY)
    return _client


def ensure_collection() -> None:
    client = get_qdrant()
    try:
        info = client.get_collection(settings.QDRANT_COLLECTION)
        # recreate if dims mismatch
        size = info.config.params.vectors.size  # type: ignore[union-attr]
        if size == settings.EMBEDDING_DIMS:
            return
        client.delete_collection(settings.QDRANT_COLLECTION)
    except Exception:
        pass
    client.create_collection(
        collection_name=settings.QDRANT_COLLECTION,
        vectors_config=qmodels.VectorParams(
            size=settings.EMBEDDING_DIMS, distance=qmodels.Distance.COSINE
        ),
    )
    for field in ("workspaceId", "documentId", "sourceId"):
        try:
            client.create_payload_index(
                collection_name=settings.QDRANT_COLLECTION,
                field_name=field,
                field_schema=qmodels.PayloadSchemaType.KEYWORD,
            )
        except Exception:
            pass


def upsert_chunks(
    *,
    workspace_id: str,
    source_id: str,
    document_id: str,
    filename: str,
    chunks: list[str],
    vectors: list[list[float]],
) -> int:
    client = get_qdrant()
    points = [
        qmodels.PointStruct(
            id=str(uuid.uuid4()),
            vector=vec,
            payload={
                "workspaceId": workspace_id,
                "sourceId": source_id,
                "documentId": document_id,
                "filename": filename,
                "chunkIndex": i,
                "content": text,
            },
        )
        for i, (text, vec) in enumerate(zip(chunks, vectors))
    ]
    # replace previous points for idempotent re-ingest
    delete_by_document(document_id)
    if points:
        client.upsert(collection_name=settings.QDRANT_COLLECTION, points=points)
    return len(points)


def search(*, workspace_id: str, vector: list[float], top_k: int = 5):
    client = get_qdrant()
    return client.query_points(
        collection_name=settings.QDRANT_COLLECTION,
        query=vector,
        limit=top_k,
        query_filter=qmodels.Filter(
            must=[
                qmodels.FieldCondition(
                    key="workspaceId",
                    match=qmodels.MatchValue(value=workspace_id),
                )
            ]
        ),
        with_payload=True,
    )


def delete_by_document(document_id: str) -> None:
    client = get_qdrant()
    try:
        client.delete(
            collection_name=settings.QDRANT_COLLECTION,
            points_selector=qmodels.FilterSelector(
                filter=qmodels.Filter(
                    must=[
                        qmodels.FieldCondition(
                            key="documentId",
                            match=qmodels.MatchValue(value=document_id),
                        )
                    ]
                )
            ),
        )
    except Exception:
        pass
