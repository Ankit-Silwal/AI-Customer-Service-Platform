import "dotenv/config";
import { Worker } from "bullmq";
import { Redis } from "ioredis";
import prisma from "../config/prisma.js";
import type { IngestJob } from "../config/queue.js";
import { updateDocumentStatus } from "../modules/knowledge/knowledge.repository.js";

const RAG_URL = process.env.RAG_SERVICE_URL?.replace(/\/$/, "") ?? "http://localhost:8001";

function connection() {
  const url = process.env.REDIS_URL;
  if (url) return new Redis(url, { maxRetriesPerRequest: null });
  return { host: "localhost", port: 6666 };
}

// Node owns Document.status; Python stays stateless re Postgres.
// Flow per job: PROCESSING -> POST rag /ingest/sync -> READY/FAILED.
const worker = new Worker(
  "document-processing",
  async (job) => {
    const { documentId, sourceId, workspaceId, storageKey, filename } = job.data as IngestJob;
    await updateDocumentStatus(documentId, "PROCESSING");
    try {
      const res = await fetch(`${RAG_URL}/ingest/sync`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ documentId, sourceId, workspaceId, storageKey, filename }),
        signal: AbortSignal.timeout(120_000),
      });
      if (!res.ok) throw new Error(`RAG ingest/sync failed: ${res.status} ${await res.text()}`);
      await updateDocumentStatus(documentId, "READY");
    } catch (err) {
      await updateDocumentStatus(documentId, "FAILED");
      throw err;
    }
  },
  { connection: connection() as never, concurrency: 2 }
);

worker.on("failed", (job, err) => console.error(`Ingest job ${job?.id} failed:`, err?.message ?? err));
worker.on("completed", (job) => console.log(`Ingest job ${job?.id} ready`));

async function shutdown() {
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

console.log("Ingestion worker started (document-processing)");
