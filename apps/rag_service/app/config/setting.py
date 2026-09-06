import os 
from dotenv import load_dotenv

load_dotenv()
QDRANT_URL=os.getenv("QDRANT_URL")

embedding_model=os.getenv(
  "EMBEDDING_MODEL","BAAI/bge-small-en-v1.5"
)

OLLAMA_URL=os.getenv("OLLAMA_URL","http://localhost:11434")
OLLAMA_MODEL=os.getenv("OLLAMA_MODEL","llama3.2:3b")