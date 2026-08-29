import type { Request,Response } from "express";
import { createKnowledgeSourceService } from "./knowledge.service.js";

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