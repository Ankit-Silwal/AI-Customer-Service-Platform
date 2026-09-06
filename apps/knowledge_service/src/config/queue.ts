import { Queue } from "bullmq";
import { Redis } from "ioredis";

function redisConnection() {
  // REDIS_URL preferred (redis://localhost:6666 in dev compose).
  // Falls back to previous hardcoded default so existing setups keep working.
  const url = process.env.REDIS_URL;
  if (url) return new Redis(url, { maxRetriesPerRequest: null });
  return { host: "localhost", port: 6666 };
}

export const documentQueue = new Queue("document-processing", {
  connection: redisConnection() as never,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

export interface IngestJob {
  documentId: string;
  sourceId: string;
  workspaceId: string;
  storageKey: string;
  filename: string;
}

export async function enqueueIngest(job: IngestJob): Promise<void> {
  // jobId = documentId makes re-uploads/re-tries idempotent in the queue.
  await documentQueue.add("process-document", job, { jobId: job.documentId });
}
