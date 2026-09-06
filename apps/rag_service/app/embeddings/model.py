from sentence_transformers import SentenceTransformer

from app.config.setting import embedding_model

model=SentenceTransformer(embedding_model)

def create_embedding(text:str)->list[float]:
  embedding=model.encode(
    text,
    normalize_embeddings=True
  )
  return embedding.tolist()