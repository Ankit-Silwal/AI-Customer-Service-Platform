import type { Request, Response } from "express";
import { generateAnswer } from "./rag.service.js";

export async function queryRagController(req: Request, res: Response) {
  try {
    const { question, workspaceId, topK } = req.body;
    if (!question || !workspaceId) {
      return res.status(400).json({ message: "question and workspaceId are required" });
    }
    const result = await generateAnswer(question, workspaceId, topK ?? 5);
    return res.json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error instanceof Error ? error.message : "Query failed" });
  }
}