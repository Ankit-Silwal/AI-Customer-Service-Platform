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

export const workspaceQuerySchema = z.object({
  workspaceId: z.string().min(1, "workspaceId is required"),
});

export const sourceIdParamSchema = z.object({
  sourceId: z.string().uuid("sourceId must be a valid UUID"),
});

export const renameSourceSchema = z.object({
  name: z.string().trim().min(1, "Knowledge Source name is required").max(200),
});
