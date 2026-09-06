"""Central settings for the RAG service (Python + Qdrant)."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Supabase (original file bytes)
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_BUCKET: str = "knowledge-docs"

    # LLM (gemini via OpenAI-compatible endpoint, or plain openai)
    # LLM_PROVIDER=gemini | openai
    LLM_PROVIDER: str = "gemini"
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""
    OPENAI_BASE_URL: str | None = None
    LLM_MODEL: str = "gemini-3.1-flash-lite"

    # Embeddings (huggingface local, or openai)
    # EMBEDDING_PROVIDER=huggingface | openai
    EMBEDDING_PROVIDER: str = "huggingface"
    EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5"
    EMBEDDING_DIMS: int = 384

    # Qdrant
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: str | None = None
    QDRANT_COLLECTION: str = "knowledge_chunks"

    # Postgres (same DB as knowledge_service, only to flip Document.status)
    DATABASE_URL: str = ""

    # Chunking (RecursiveCharacterTextSplitter defaults)
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 400
    MAX_CHUNKS_PER_DOC: int = 500

    PORT: int = 8001


settings = Settings()
