import type { Request,Response } from "express";
import { createKnowledgeSourceService } from "./knowledge.service.js";
import { getDocument, listDocuments, removeDocument, uploadDocument } from "./knowledge.service.js";
import { documentIdSchema, listDocumentsSchema, uploadDocumentSchema } from "./knowledge.schema.js";

export async function uploadDocumentController(
  req: Request,
  res: Response,
) {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "File is required",
      });
    }
    const parsed = uploadDocumentSchema.safeParse({ sourceId: req.body.sourceId });
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues[0]?.message ?? "Invalid sourceId",
      });
    }
    const document = await uploadDocument(
      req.file,
      parsed.data.sourceId,
    );
    return res.status(201).json({
      message: "Document uploaded successfully",
      document,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Document upload failed",
    });
  }
}

export async function createKnowledgeSourceController(req:Request,res:Response) {
  try{
    const source=await createKnowledgeSourceService(req.body);
    return res.status(201).json(source);
  }catch(error){
    return res.status(400).json({
      message:error instanceof Error?error.message:"Something went wrong"
    })
  }
}

export async function listDocumentsController(req: Request, res: Response) {
  const parsed = listDocumentsSchema.safeParse({ sourceId: req.query.sourceId });
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid sourceId" });
  }
  try {
    return res.json(await listDocuments(parsed.data.sourceId));
  } catch (error) {
    const status = error instanceof Error && /not found/i.test(error.message) ? 404 : 400;
    return res.status(status).json({ message: error instanceof Error ? error.message : "Failed to list documents" });
  }
}

export async function getDocumentController(req: Request, res: Response) {
  const parsed = documentIdSchema.safeParse({ documentId: req.params.documentId });
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid documentId" });
  }
  try {
    return res.json(await getDocument(parsed.data.documentId));
  } catch (error) {
    const status = error instanceof Error && /not found/i.test(error.message) ? 404 : 400;
    return res.status(status).json({ message: error instanceof Error ? error.message : "Failed to get document" });
  }
}

export async function deleteDocumentController(req: Request, res: Response) {
  const parsed = documentIdSchema.safeParse({ documentId: req.params.documentId });
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid documentId" });
  }
  try {
    await removeDocument(parsed.data.documentId);
    return res.json({ message: "Document deleted" });
  } catch (error) {
    const status = error instanceof Error && /not found/i.test(error.message) ? 404 : 400;
    return res.status(status).json({ message: error instanceof Error ? error.message : "Failed to delete document" });
  }
}