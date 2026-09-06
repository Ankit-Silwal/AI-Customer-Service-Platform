from app.vector_store.qdrant import vector_store

def search_knowledge(
  query:str,
  workspaceId:str,
  limit:int=5,
):
  results=vector_store.similarity_search(
    query,
    k=limit,
    filter={
      "must":{
        "key":"metadata.workspaceId",
        "match":{
          "value":workspaceId
        }
      }
    }
  )
  return results