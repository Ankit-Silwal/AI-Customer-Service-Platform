import type { Request, Response } from "express";
import { createWorkspace } from "./workspace.service.js";

export async function createWorkspaceController(
  req: Request,
  res: Response,
) {
  try {
    const userId = req.header("x-user-id");

    if (!userId) {
      return res.status(401).json({
        message: "User ID is required",
      });
    }
    const workspace = await createWorkspace(req.body, userId);
    return res.status(201).json(workspace);
  } catch (error) {
    return res.status(400).json({
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
}