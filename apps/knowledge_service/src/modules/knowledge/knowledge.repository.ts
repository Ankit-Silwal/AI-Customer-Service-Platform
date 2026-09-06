import prisma from "../../config/prisma.js";
import { KnowledgeSourceType } from "../../../generated/prisma/enums.js";

export async function createKnowledgeSource(data:{
  workspaceId:string;
  name:string;
  type:KnowledgeSourceType
}){
  return prisma.knowledgeSource.create({
    data
  })
}

export async function createDocument(data:{
  sourceId:string,
  filename:string,
  storageKey:string
}){
  return prisma.document.create({
    data:{
      sourceId:data.sourceId,
      filename:data.filename,
      storageKey:data.storageKey
    }
  })
}

export async function findDocumentById(id:string){
  return prisma.document.findUnique({
    where:{ id }
  })
}
