from qdrant_client import QdrantClient
from langchain_qdrant import QdrantVectorStore

from app.embeddings.model import embeddings

QDRANT_URL="http://localhost:6333"
COLLECTION_NAME="knowledge_chunks"

client=QdrantClient(url=QDRANT_URL)

client=QdrantVectorStore(
  client=client,
  collection_name=COLLECTION_NAME,
  embedding=embeddings
)