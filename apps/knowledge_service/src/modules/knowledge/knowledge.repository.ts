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

export async function listSourcesByWorkspace(workspaceId: string) {
  return prisma.knowledgeSource.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSourceById(sourceId: string) {
  return prisma.knowledgeSource.findUnique({ where: { id: sourceId } });
}

export async function updateSourceById(sourceId: string, data: { name?: string }) {
  return prisma.knowledgeSource.update({ where: { id: sourceId }, data });
}

export async function deleteSourceById(sourceId: string) {
  return prisma.knowledgeSource.delete({ where: { id: sourceId } });
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

export async function updateDocumentStatus(documentId: string, status: "UPLOADED" | "PROCESSING" | "READY" | "FAILED") {
  return prisma.document.update({ where: { id: documentId }, data: { status } });
}
