import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";

const app = express();
app.disable("x-powered-by");
app.use(cors({ origin: true, credentials: true }));
// Skip JSON parsing for multipart (file uploads) so we can stream them raw.
app.use((req, res, next) => {
  if (req.headers["content-type"]?.includes("multipart")) return next();
  express.json()(req, res, next);
});

// No business logic here: routing + request-id + error shape only.
// Auth propagation: browser cookies (sessionId) are forwarded as-is.
const T = (v: string | undefined, fallback: string) => (v && v.trim() ? v.replace(/\/$/, "") : fallback);

function resolveUpstream(path: string, query: string): string | null {
  const IDENTITY = T(process.env.IDENTITY_URL, "http://localhost:8000");
  const WORKSPACE = T(process.env.WORKSPACE_URL, "http://localhost:7999");
  const KNOWLEDGE = T(process.env.KNOWLEDGE_URL, "http://localhost:7998");
  const RAG = T(process.env.RAG_URL, "http://localhost:8001");
  const CONV = T(process.env.CONVERSATION_URL, "http://localhost:3004");
  const TICKET = T(process.env.TICKET_URL, "http://localhost:3005");
  const NOTIF = T(process.env.NOTIFICATION_URL, "http://localhost:3006");
  const ANALYTICS = T(process.env.ANALYTICS_URL, "http://localhost:3007");
  const q = query.includes("?") ? query.slice(query.indexOf("?")) : "";
  // Identity mounts at /api
  if (path.startsWith("/api/identity/")) return `${IDENTITY}/api/${path.slice("/api/identity/".length)}${q}`;
  // Workspace mounts at /api (workspaces, invitations, internal)
  if (path.startsWith("/api/workspaces") || path.startsWith("/api/invitations") || path.startsWith("/api/internal"))
    return `${WORKSPACE}/api${path.slice("/api".length)}${q}`;
  // Knowledge mounts at /knowledge + /rag
  if (path.startsWith("/api/knowledge/")) return `${KNOWLEDGE}/knowledge/${path.slice("/api/knowledge/".length)}${q}`;
  // RAG: /api/rag/query -> /query, /api/rag/search -> /rag/search, /api/rag/ingest -> /ingest
  if (path === "/api/rag/query" || path === "/api/rag/ingest" || path === "/api/rag/ingest/sync")
    return `${RAG}/${path.slice("/api/rag/".length)}${q}`;
  if (path === "/api/rag/search") return `${RAG}/rag/search${q}`;
  if (path.startsWith("/api/rag/documents/")) return `${RAG}/documents/${path.slice("/api/rag/documents/".length)}${q}`;
  // Conversation mounts at /conversations
  if (path.startsWith("/api/conversations")) return `${CONV}/conversations${path.slice("/api/conversations".length) || ""}${q}`;
  // Ticket mounts /tickets* at root
  if (path.startsWith("/api/tickets")) return `${TICKET}/tickets${path.slice("/api/tickets".length) || ""}${q}`;
  // Notification mounts /notifications at root
  if (path.startsWith("/api/notifications")) return `${NOTIF}/notifications${path.slice("/api/notifications".length) || ""}${q}`;
  // Analytics mounts /events + /metrics at root
  if (path.startsWith("/api/analytics/")) return `${ANALYTICS}/${path.slice("/api/analytics/".length)}${q}`;
  return null;
}

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Resolve the caller's user id from the Identity session cookie so downstream
// services (workspace, etc.) don't have to trust client-supplied user ids.
async function resolveUserId(cookie: string | undefined): Promise<string | null> {
  if (!cookie) return null;
  try {
    const r = await fetch(`${T(process.env.IDENTITY_URL, "http://localhost:8000")}/api/auth/me`, {
      headers: { cookie, "x-request-id": randomUUID() },
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return null;
    const data = (await r.json()) as { user?: { id?: string } };
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

app.use(async (req, res) => {
  const requestId = randomUUID();
  res.setHeader("x-request-id", requestId);
  const upstream = resolveUpstream(req.path, req.url);
  if (!upstream) return res.status(404).json({ message: "Unknown route", requestId });
  try {
    const headers: Record<string, string> = { "x-request-id": requestId };
    if (req.headers.cookie) headers.cookie = req.headers.cookie;
    if (process.env.INTERNAL_API_TOKEN) headers["x-internal-token"] = process.env.INTERNAL_API_TOKEN;
    const userId = await resolveUserId(req.headers.cookie);
    if (userId) headers["x-user-id"] = userId;
    const isMultipart = req.headers["content-type"]?.includes("multipart") ?? false;
    let body: unknown;
    if (["GET", "HEAD"].includes(req.method)) {
      body = undefined;
    } else if (isMultipart) {
      headers["content-type"] = String(req.headers["content-type"]);
      if (req.headers["content-length"]) headers["content-length"] = String(req.headers["content-length"]);
      body = req;
    } else {
      headers["content-type"] = "application/json";
      body = JSON.stringify(req.body ?? {});
    }
    const r = await fetch(upstream, {
      method: req.method,
      headers,
      body: body as never,
      signal: AbortSignal.timeout(30_000),
      ...(isMultipart ? { duplex: "half" as never } : {}),
    });
    const text = await r.text();
    res.status(r.status);
    const ct = r.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      try { return res.json(text ? JSON.parse(text) : {}); }
      catch { return res.send(text); }
    }
    if (ct) res.setHeader("content-type", ct);
    return res.send(text);
  } catch (e) {
    return res.status(502).json({ message: e instanceof Error ? e.message : "Upstream failed", requestId });
  }
});
export default app;
