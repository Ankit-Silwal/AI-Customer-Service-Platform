import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export function requestId(req: Request, res: Response, next: NextFunction) {
  const id = (req.headers["x-request-id"] as string) || randomUUID();
  res.setHeader("x-request-id", id);
  (req as Request & { requestId?: string }).requestId = id;
  next();
}

export function requireInternalToken(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.INTERNAL_API_TOKEN;
  if (!expected) return next(); // dev default: open, gateway adds token in prod
  if (req.headers["x-internal-token"] === expected) return next();
  res.status(401).json({ message: "Invalid internal token" });
}
