import { randomBytes } from "crypto";
import type { Request } from "express";
import REDIS_CLIENT, { isRedisConnected } from "../../config/redis.js";
import type { SessionInfo, SessionResult } from "./session.types.js";

const SESSION_TTL = 24 * 60 * 60;

const inMemorySessions = new Map<string, SessionInfo>();
const userSessions = new Map<string, Set<string>>();

export function getInMemorySession(sessionId: string): SessionInfo | undefined {
  return inMemorySessions.get(sessionId);
}

export function hasInMemorySession(sessionId: string): boolean {
  return inMemorySessions.has(sessionId);
}

export async function getSessionById(sessionId: string): Promise<SessionInfo | null> {
  if (isRedisConnected()) {
    const rawSession = await REDIS_CLIENT.get(`session:${sessionId}`);
    if (!rawSession) {
      return null;
    }

    return JSON.parse(rawSession) as SessionInfo;
  }

  return inMemorySessions.get(sessionId) ?? null;
}

export function generateSessionId(): string {
  return randomBytes(32).toString("hex");
}

export async function createSession(userId: string | number, req: Request): Promise<string> {
  const sessionId = generateSessionId();
  const sessionData: SessionInfo = {
    sessionId,
    userId: userId.toString(),
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + SESSION_TTL * 1000).toISOString(),
    ip: req.ip ?? "unknown",
    userAgent: req.get("user-agent") ?? "unknown",
  };

  if (isRedisConnected()) {
    const sessionKey = `session:${sessionId}`;
    await REDIS_CLIENT.set(sessionKey, JSON.stringify(sessionData), {
      EX: SESSION_TTL,
    });
    const userSessionKey = `user:sessions:${userId}`;
    await REDIS_CLIENT.sAdd(userSessionKey, sessionId);
    await REDIS_CLIENT.expire(userSessionKey, SESSION_TTL);
  } else {
    inMemorySessions.set(sessionId, sessionData);
    const userKey = userId.toString();
    if (!userSessions.has(userKey)) {
      userSessions.set(userKey, new Set());
    }
    userSessions.get(userKey)!.add(sessionId);

    setTimeout(() => {
      inMemorySessions.delete(sessionId);
      userSessions.get(userKey)?.delete(sessionId);
    }, SESSION_TTL * 1000);
  }

  return sessionId;
}

export async function deleteSession(
  userId: string | number,
  req: Request,
): Promise<SessionResult> {
  const sessionId = req.cookies?.sessionId;

  if (!sessionId) {
    return {
      success: false,
      message: "Session doesn't exists",
    };
  }

  if (isRedisConnected()) {
    const key = `session:${sessionId}`;
    const result = await REDIS_CLIENT.del(key);
    await REDIS_CLIENT.sRem(`user:sessions:${userId}`, sessionId);
    if (result > 0) {
      return {
        success: true,
        message: `Session for ${userId} was deleted successfully`,
      };
    }
  } else if (inMemorySessions.has(sessionId)) {
    inMemorySessions.delete(sessionId);
    userSessions.get(userId.toString())?.delete(sessionId);
    return {
      success: true,
      message: `Session for ${userId} was deleted successfully`,
    };
  }

  return {
    success: false,
    message: "Session doesn't exists",
  };
}

export async function deleteAllSession(userId: string | number): Promise<SessionResult> {
  let deletedCount = 0;

  if (isRedisConnected()) {
    const userSessionKey = `user:sessions:${userId}`;
    const sessions = await REDIS_CLIENT.sMembers(userSessionKey);
    for (const session of sessions) {
      const result = await REDIS_CLIENT.del(`session:${session}`);
      if (result > 0) {
        deletedCount++;
      }
    }
    await REDIS_CLIENT.del(userSessionKey);
  } else {
    const userKey = userId.toString();
    const sessions = userSessions.get(userKey);
    if (sessions) {
      sessions.forEach((sessionId) => {
        if (inMemorySessions.delete(sessionId)) {
          deletedCount++;
        }
      });
      userSessions.delete(userKey);
    }
  }

  return {
    success: true,
    message: `Thus ${deletedCount} sessions were removed`,
  };
}

export async function getAllSession(userId: string | number): Promise<SessionInfo[]> {
  const results: SessionInfo[] = [];

  if (isRedisConnected()) {
    const userSessionKey = `user:sessions:${userId}`;
    const sessionIds = await REDIS_CLIENT.sMembers(userSessionKey);
    if (!sessionIds || sessionIds.length === 0) {
      return [];
    }

    const rawSessions = await Promise.all(
      sessionIds.map((id) => REDIS_CLIENT.get(`session:${id}`)),
    );

    for (let index = 0; index < sessionIds.length; index++) {
      const raw = rawSessions[index];
      const sessionId = sessionIds[index]!;
      if (!raw) {
        await REDIS_CLIENT.sRem(userSessionKey, sessionId);
        continue;
      }

      const parsed = JSON.parse(raw) as SessionInfo;
      results.push({
        sessionId,
        userId: parsed.userId,
        ip: parsed.ip,
        userAgent: parsed.userAgent,
        createdAt: parsed.createdAt,
        expiresAt: parsed.expiresAt,
      });
    }
  } else {
    const userKey = userId.toString();
    const sessions = userSessions.get(userKey);
    if (sessions) {
      sessions.forEach((sessionId) => {
        const sessionData = inMemorySessions.get(sessionId);
        if (sessionData) {
          results.push(sessionData);
        }
      });
    }
  }

  return results;
}

export async function removeSpecificSession(
  userId: string | number,
  sessionId: string,
): Promise<SessionResult> {
  if (isRedisConnected()) {
    const sessionKey = `session:${sessionId}`;
    const userSessionKey = `user:sessions:${userId}`;

    const result = await REDIS_CLIENT.del(sessionKey);
    await REDIS_CLIENT.sRem(userSessionKey, sessionId);

    if (result > 0) {
      return {
        success: true,
        message: `Session ${sessionId} deleted for ${userId}`,
      };
    }
  } else {
    const userKey = userId.toString();
    if (inMemorySessions.has(sessionId)) {
      inMemorySessions.delete(sessionId);
      userSessions.get(userKey)?.delete(sessionId);
      return {
        success: true,
        message: `Session ${sessionId} deleted for ${userId}`,
      };
    }
  }

  return {
    success: false,
    message: `Session ${sessionId} not found`,
  };
}