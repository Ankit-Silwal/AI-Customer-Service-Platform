import { createKnowledgeSource } from "./knowledge.repository.js";
import type { CreateKnowledgeSourceInput } from "./knowledge.types.js";
import { createDocument } from "./knowledge.repository.js";
import { uploadFile } from "../storage/storage.service.js";
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


export async function uploadDocument(
  file: Express.Multer.File,
  sourceId: string,
) {
  const storageKey = await uploadFile(file);

  return createDocument({
    sourceId,
    filename: file.originalname,
    storageKey,
  });
}