/** DEPRECATED: canonical pipeline is apps/rag_service (Python + Qdrant).
 * Kept for reference; knowledge.service now triggers Python /ingest. */
// @ts-nocheck
import { Worker } from "bullmq";
import { PrismaClient } from "../../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { supabase } from "../config/supabase.js";
import OpenAI from "openai";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

const connection = { host: "localhost", port: 6666 };
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const bucket = process.env.SUPABASE_BUCKET!;

async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === "application/pdf") {
    const data = await pdfParse(buffer);
    return data.text;
  }
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  return buffer.toString("utf-8");
}

function chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize - overlap) {
    const chunk = text.slice(i, i + chunkSize).trim();
    if (chunk) chunks.push(chunk);
  }
  return chunks;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

const worker = new Worker(
  "document-processing",
  async (job) => {
    const { documentId } = job.data;
    console.log(`Processing document ${documentId}`);

    await prisma.document.update({
      where: { id: documentId },
      data: { status: "PROCESSING" },
    });

    const document = await prisma.document.findUnique({ where: { id: documentId } });
    if (!document) throw new Error("Document not found");

    const { data: fileData, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(document.storageKey);
    if (downloadError) throw new Error(`Download failed: ${downloadError.message}`);

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const text = await extractText(buffer, document.filename.includes(".pdf") ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

    const chunks = chunkText(text);

    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(chunks[i]);
      await prisma.$executeRawUnsafe(
        `INSERT INTO "DocumentChunk" (id, "documentId", content, embedding, "chunkIndex", "createdAt") VALUES (gen_random_uuid(), $1, $2, $3::vector, $4, NOW())`,
        documentId,
        chunks[i],
        `[${embedding.join(",")}]`,
        i
      );
    }

    await prisma.document.update({
      where: { id: documentId },
      data: { status: "READY" },
    });

    console.log(`Document ${documentId} processed: ${chunks.length} chunks`);
  },
  { connection, concurrency: 2 }
);

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
  if (job?.data?.documentId) {
    prisma.document.update({ where: { id: job.data.documentId }, data: { status: "FAILED" } }).catch(console.error);
  }
});

console.log("Document processor worker started");