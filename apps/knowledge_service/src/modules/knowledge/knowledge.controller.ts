import type { Request,Response } from "express";
import { createKnowledgeSourceService } from "./knowledge.service.js";
import { uploadDocument } from "./knowledge.service.js";

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
    const sourceId = req.body.sourceId;
    if (!sourceId) {
      return res.status(400).json({
        message: "sourceId is required",
      });
    }
    const document = await uploadDocument(
      req.file,
      sourceId,
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