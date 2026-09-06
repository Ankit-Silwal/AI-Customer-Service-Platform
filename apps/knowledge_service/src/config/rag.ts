const RAG_URL = process.env.RAG_SERVICE_URL?.replace(/\/$/, "") ?? "http://localhost:8001";

async function post(path: string, body: unknown) {
  const res = await fetch(`${RAG_URL}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`RAG ${path} failed: ${res.status}`);
  return res.json();
}

export function triggerIngest(input: {
  documentId: string;
  sourceId: string;
  workspaceId: string;
  storageKey: string;
  filename: string;
}): void {
  // Fire-and-forget: upload should not block on embedding.
  void post("/ingest", input).catch((err) => console.error("RAG ingest trigger failed:", err));
}

export async function queryRagService(question: string, workspaceId: string, topK = 5) {
  return post("/query", { question, workspaceId, topK }) as Promise<{
    answer: string;
    sources: Array<{
      content: string;
      score: number;
      documentId: string;
      sourceId: string;
      filename: string;
    }>;
  }>;
}

export async function deleteDocumentFromRag(documentId: string): Promise<void> {
  const res = await fetch(`${RAG_URL}/documents/${documentId}`, {
    method: "DELETE",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`RAG delete failed: ${res.status}`);
}
