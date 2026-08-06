import type { NextFunction, Request, Response } from "express";
import { findUserById } from "../modules/auth/auth.repository.js";
import { getSessionById } from "../modules/session/session.manager.js";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionId = req.cookies?.sessionId;
    if (!sessionId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const session = await getSessionById(sessionId);
    if (!session) {
      res.status(401).json({ message: "Invalid or expired session" });
      return;
    }

    const user = await findUserById(session.userId);
    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    req.auth = {
      user,
      session,
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function requireVerifiedAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.auth?.user.isEmailVerified) {
    res.status(403).json({ message: "Email verification required" });
    return;
  }

  next();
}