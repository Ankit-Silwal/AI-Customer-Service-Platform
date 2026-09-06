from fastapi import APIRouter
from pydantic import BaseModel

from app.chunking.chunker import split_text
from app.vector_store.qdrant import vector_store
# from app.embeddings.model import create_embedding

router=APIRouter()

# class EmbeddingRequests(BaseModel):
#   text:str
  
# @router.post("/embed")
# def embed(request:EmbeddingRequests):
#   vector=create_embedding(request.text)
#   return{
#     "dimensions":len(vector),
#     "embeddings":vector
#   }
  
class IngestRequest(BaseModel):
  text:str
  workspaceId:str

@router.post('/ingest')
def ingest(request:IngestRequest):
  documents=split_text(request.text)
  for document in documents:
    document.metadata["workspaceId"]=request.workspaceId
  ids=vector_store.add_document(documents)
  return{
    "chunks":len(documents),
    "ids":ids
  }