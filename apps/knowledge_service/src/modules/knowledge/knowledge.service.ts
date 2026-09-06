import {
  createDocument,
  createKnowledgeSource,
  deleteDocumentById,
  deleteSourceById,
  getDocumentById,
  getSourceById,
  listDocumentsBySource,
  listSourcesByWorkspace,
  updateSourceById,
} from "./knowledge.repository.js";
import type { CreateKnowledgeSourceInput } from "./knowledge.types.js";
import { deleteFile, uploadFile } from "../storage/storage.service.js";
import { deleteDocumentFromRag, triggerIngest } from "../../config/rag.js";
import prisma from "../../config/prisma.js";
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

export async function listSources(workspaceId: string) {
  if (!workspaceId.trim()) throw new Error("workspaceId is required");
  return listSourcesByWorkspace(workspaceId.trim());
}

export async function getSource(sourceId: string) {
  const s = await getSourceById(sourceId);
  if (!s) throw new Error("Knowledge source not found");
  return s;
}

export async function renameSource(sourceId: string, name: string) {
  const trimmed = name?.trim();
  if (!trimmed) throw new Error("Knowledge Source name is required");
  await getSource(sourceId);
  return updateSourceById(sourceId, { name: trimmed });
}

export async function removeSource(sourceId: string) {
  const s = await getSource(sourceId);
  // Delete vectors + files for every document first (idempotent), then DB cascade.
  const docs = await listDocumentsBySource(sourceId);
  for (const d of docs) {
    try { await deleteDocumentFromRag(d.id); } catch (err) { console.error("RAG delete failed:", err); }
    await deleteFile(d.storageKey);
  }
  void s;
  return deleteSourceById(sourceId);
}


export async function uploadDocument(
  file: Express.Multer.File,
  sourceId: string,
) {
  // Fail fast before bytes leave the server: no orphan uploads on bad sourceId.
  const source = await prisma.knowledgeSource.findUnique({ where: { id: sourceId } });
  if (!source) throw new Error("Knowledge source not found");

  const storageKey = await uploadFile(file, source.workspaceId);

  try {
    const document = await createDocument({
      sourceId,
      filename: file.originalname,
      storageKey,
    });
    // BullMQ owns the handoff; the Node worker calls Python /ingest/sync
    // and flips UPLOADED -> PROCESSING -> READY/FAILED. Direct HTTP is the
    // fallback only if Redis is down, so uploads never hard-fail.
    try {
      const { enqueueIngest } = await import("../../config/queue.js");
      await enqueueIngest({
        documentId: document.id,
        sourceId,
        workspaceId: source.workspaceId,
        storageKey,
        filename: file.originalname,
      });
    } catch (err) {
      console.error("Queue enqueue failed, falling back to direct ingest:", err);
      triggerIngest({
        documentId: document.id,
        sourceId,
        workspaceId: source.workspaceId,
        storageKey,
        filename: file.originalname,
      });
    }
    return document;
  } catch (err) {
    await deleteFile(storageKey);
    throw err;
  }
}

export async function listDocuments(sourceId: string) {
  const source = await prisma.knowledgeSource.findUnique({ where: { id: sourceId } });
  if (!source) throw new Error("Knowledge source not found");
  return listDocumentsBySource(sourceId);
}

export async function getDocument(documentId: string) {
  const doc = await getDocumentById(documentId);
  if (!doc) throw new Error("Document not found");
  return doc;
}

export async function removeDocument(documentId: string) {
  const doc = await getDocumentById(documentId);
  if (!doc) throw new Error("Document not found");
  // External deletes are idempotent: safe to run before the DB delete.
  // If the DB delete fails, a retry cleans up again with no side effects.
  try {
    await deleteDocumentFromRag(documentId);
  } catch (err) {
    console.error("RAG delete failed:", err);
  }
  await deleteFile(doc.storageKey);
  return deleteDocumentById(documentId);
}