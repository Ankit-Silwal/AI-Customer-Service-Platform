import { createKnowledgeSource } from "./knowledge.repository.js";
import type { CreateKnowledgeSourceInput } from "./knowledge.types.js";

export async function createKnowledgeSourceService(data:CreateKnowledgeSourceInput) {
  if(!data.workspaceId){
    throw new Error("Please pass on the workspace Id");
  }
  if(!data.name?.trim()){
    throw new Error("Knowledge Source name is required")
  }
  return createKnowledgeSource({
    workspaceId:data.workspaceId,
    name:data.name.trim(),
    type:data.type
  })
}