"""OpenAI embedding + chat helpers (batched)."""
from __future__ import annotations

from openai import OpenAI

from app.config.settings import settings

_client: OpenAI | None = None


def get_client() -> OpenAI:
    global _client
    if _client is None:
        if not settings.OPENAI_API_KEY:
            raise RuntimeError("OPENAI_API_KEY is not set")
        _client = OpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


def embed_texts(texts: list[str], batch_size: int = 64) -> list[list[float]]:
    client = get_client()
    out: list[list[float]] = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        resp = client.embeddings.create(model=settings.EMBEDDING_MODEL, input=batch)
        # ensure order by index
        ordered = sorted(resp.data, key=lambda d: d.index)
        out.extend([d.embedding for d in ordered])
    return out


def embed_one(text: str) -> list[float]:
    return embed_texts([text])[0]


def chat_answer(question: str, contexts: list[str]) -> str:
    client = get_client()
    if not contexts:
        return "I couldn't find relevant information to answer your question."
    context = "\n\n".join(f"[{i + 1}] {c}" for i, c in enumerate(contexts))
    resp = client.chat.completions.create(
        model=settings.LLM_MODEL,
        temperature=0.1,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a helpful customer service assistant. "
                    "Answer using only the provided context. "
                    "Cite sources with [1], [2], etc. "
                    "If the context lacks the answer, say so."
                ),
            },
            {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"},
        ],
    )
    return resp.choices[0].message.content or "No answer generated."
