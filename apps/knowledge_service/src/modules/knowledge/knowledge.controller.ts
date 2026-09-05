import type { Request,Response } from "express";
import { createKnowledgeSourceService } from "./knowledge.service.js";
import { uploadFile } from "../storage/storage.service.js";


export async function uploadDocument(req:Request,res:Response){
  try{
    if(!req.file){
      return res.status(400).json({
        message:"Please upload the required file"
      })
    }
    const workspaceId=req.body.workspaceId;
    const sourceId=req.body.sourceId;
    if(!workspaceId ||!sourceId){
      return res.status(400).json({
        success:false,
        message:"Please provide the workspaceId and sourceId"
      })
    }
    const storageKey=await uploadFile(req.file);
    return res.status(200).json({
      message:"File upload successfully",
      filename:req.file.filename,
      storageKey
    })
  }catch(error){
    console.error(error);
    return res.status(500).json({
      message:"Upload failed from our side"
    })
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