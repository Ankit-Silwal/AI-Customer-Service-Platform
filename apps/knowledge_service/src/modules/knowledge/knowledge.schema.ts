import { z } from "zod";

export const uploadDocumentSchema = z.object({
  sourceId: z.string().uuid("sourceId must be a valid UUID"),
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;

export const listDocumentsSchema = z.object({
  sourceId: z.string().uuid("sourceId must be a valid UUID"),
});

export const documentIdSchema = z.object({
  documentId: z.string().uuid("documentId must be a valid UUID"),
});
