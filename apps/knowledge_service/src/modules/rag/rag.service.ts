import { queryRagService } from "../../config/rag.js";

export interface SearchResult {
  content: string;
  score: number;
  documentId: string;
  sourceId: string;
  filename: string;
}

// Canonical RAG lives in apps/rag_service (Python + Qdrant).
// This module is a thin proxy so /rag/query keeps its shape.
export async function queryRag(
  question: string,
  workspaceId: string,
  topK = 5
): Promise<SearchResult[]> {
  const res = await queryRagService(question, workspaceId, topK);
  return res.sources;
}

export async function generateAnswer(
  question: string,
  workspaceId: string,
  topK = 5
): Promise<{ answer: string; sources: SearchResult[] }> {
  const res = await queryRagService(question, workspaceId, topK);
  return { answer: res.answer, sources: res.sources };
}
