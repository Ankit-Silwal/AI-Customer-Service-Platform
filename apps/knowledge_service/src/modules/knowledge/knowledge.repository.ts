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

export async function listDocumentsBySource(sourceId: string) {
  return prisma.document.findMany({
    where: { sourceId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDocumentById(documentId: string) {
  return prisma.document.findUnique({ where: { id: documentId } });
}

export async function deleteDocumentById(documentId: string) {
  return prisma.document.delete({ where: { id: documentId } });
}
