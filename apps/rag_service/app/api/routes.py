from fastapi import APIRouter
from pydantic import BaseModel
from app.embeddings.model import create_embedding

router=APIRouter()

class EmbeddingRequests(BaseModel):
  text:str
  
@router.post("/embed")
def embed(request:EmbeddingRequests):
  vector=create_embedding(request.text)
  return{
    "dimensions":len(vector),
    "embeddings":vector
  }