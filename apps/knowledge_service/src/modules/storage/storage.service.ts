import { randomUUID } from "node:crypto";
import { supabase } from "../../config/supabase.js";

const bucket = process.env.SUPABASE_BUCKET;
if (!bucket) {
  throw new Error("Supabase bucket isnt provided");
}

function sanitize(name: string): string {
  return name
    .split(/[/\\]/)
    .pop()!
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .slice(0, 180) || "file";
}

export async function uploadFile(file: Express.Multer.File, workspaceId: string) {
  if (!workspaceId?.trim()) throw new Error("workspaceId is required for storage key");
  const storageKey = `workspaces/${workspaceId}/documents/${randomUUID()}-${sanitize(file.originalname)}`;
  const { error } = await supabase.storage
    .from(bucket!)
    .upload(storageKey, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });
  if (error) {
    throw new Error(`Supabase upload failed:${error.message}`);
  }
  return storageKey;
}

export async function deleteFile(storageKey: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket!).remove([storageKey]);
  if (error) console.error("Supabase orphan cleanup failed:", error.message);
}
