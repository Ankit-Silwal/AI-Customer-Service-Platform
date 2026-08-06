import type { NextFunction, Request, Response } from "express";
import { deleteAllSession, deleteSession, getAllSession, removeSpecificSession } from "./session.manager.js";

async function handleAsync(
  handler: (req: Request, res: Response) => Promise<void>,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    await handler(req, res);
  } catch (error) {
    next(error);
  }
}

export function getSessionsController(req: Request, res: Response, next: NextFunction) {
  return handleAsync(async (request, response) => {
    if (!request.auth) {
      throw new Error("Authentication required");
    }
    const sessions = await getAllSession(request.auth.user.id);
    response.status(200).json({ success: true, sessions });
  }, req, res, next);
}

export function deleteSessionController(req: Request, res: Response, next: NextFunction) {
  return handleAsync(async (request, response) => {
    if (!request.auth) {
      throw new Error("Authentication required");
    }
    const result = await deleteSession(request.auth.user.id, request);
    response.status(result.success ? 200 : 404).json(result);
  }, req, res, next);
}

export function deleteAllSessionsController(req: Request, res: Response, next: NextFunction) {
  return handleAsync(async (request, response) => {
    if (!request.auth) {
      throw new Error("Authentication required");
    }
    const result = await deleteAllSession(request.auth.user.id);
    response.status(200).json(result);
  }, req, res, next);
}

export function deleteSpecificSessionController(req: Request, res: Response, next: NextFunction) {
  return handleAsync(async (request, response) => {
    const sessionId = Array.isArray(request.params.sessionId)
      ? request.params.sessionId[0]
      : request.params.sessionId;
    if (!request.auth || !sessionId) {
      throw new Error("Authentication required")
    }
    const result = await removeSpecificSession(request.auth.user.id, sessionId);
    response.status(result.success ? 200 : 404).json(result);
  }, req, res, next);
}