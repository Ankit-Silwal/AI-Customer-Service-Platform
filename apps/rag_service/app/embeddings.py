"""Embedding + chat helpers (HuggingFace local embeddings, Gemini/OpenAI LLM)."""
from __future__ import annotations

from openai import OpenAI

from app.config.settings import settings

_client: OpenAI | None = None
_hf_model = None


def _llm_api_key() -> str:
    # Accept GEMINI_API_KEY / GOOGLE_API_KEY / OPENAI_API_KEY / lowercase api_key.
    import os

    return (
        settings.GEMINI_API_KEY
        or settings.GOOGLE_API_KEY
        or settings.OPENAI_API_KEY
        or os.getenv("GEMINI_API_KEY", "")
        or os.getenv("GOOGLE_API_KEY", "")
        or os.getenv("api_key", "")
    )


def _llm_base_url() -> str | None:
    if (settings.LLM_PROVIDER or "").lower() == "gemini":
        return settings.OPENAI_BASE_URL or "https://generativelanguage.googleapis.com/v1beta/openai/"
    return settings.OPENAI_BASE_URL


def get_client() -> OpenAI:
    global _client
    if _client is None:
        api_key = _llm_api_key()
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY (or OPENAI_API_KEY) is not set")
        base_url = _llm_base_url()
        _client = OpenAI(api_key=api_key, base_url=base_url) if base_url else OpenAI(api_key=api_key)
    return _client


def _get_hf_model():
    global _hf_model
    if _hf_model is None:
        from langchain_huggingface import HuggingFaceEmbeddings

        _hf_model = HuggingFaceEmbeddings(model_name=settings.EMBEDDING_MODEL)
    return _hf_model


def _use_hf() -> bool:
    return (settings.EMBEDDING_PROVIDER or "").lower() == "huggingface"


def embed_texts(texts: list[str], batch_size: int = 64) -> list[list[float]]:
    if _use_hf():
        model = _get_hf_model()
        out: list[list[float]] = []
        for i in range(0, len(texts), batch_size):
            out.extend(model.embed_documents(texts[i : i + batch_size]))
        return out
    client = get_client()
    out = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        resp = client.embeddings.create(model=settings.EMBEDDING_MODEL, input=batch)
        # ensure order by index
        ordered = sorted(resp.data, key=lambda d: d.index)
        out.extend([d.embedding for d in ordered])
    return out


def embed_one(text: str) -> list[float]:
    if _use_hf():
        return _get_hf_model().embed_query(text)
    return embed_texts([text])[0]


def chat_answer(question: str, contexts: list[str]) -> str:
    client = get_client()
    if not contexts:
        return "I couldn't find relevant information to answer your question."
    context = "\n\n".join(f"[{i + 1}] {c}" for i, c in enumerate(contexts))
    resp = client.chat.completions.create(
        model=settings.LLM_MODEL,
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
