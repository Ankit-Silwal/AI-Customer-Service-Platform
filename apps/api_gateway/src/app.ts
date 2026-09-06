import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";

const app = express();
app.disable("x-powered-by");
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// No business logic here: routing + request-id + error shape only.
// Auth propagation: browser cookies (sessionId) are forwarded as-is.
const routes: Record<string, string | undefined> = {
  "/api/identity": process.env.IDENTITY_URL,
  "/api/workspaces": process.env.WORKSPACE_URL,
  "/api/knowledge": process.env.KNOWLEDGE_URL,
  "/api/rag": process.env.RAG_URL,
  "/api/conversations": process.env.CONVERSATION_URL,
  "/api/tickets": process.env.TICKET_URL,
  "/api/notifications": process.env.NOTIFICATION_URL,
  "/api/analytics": process.env.ANALYTICS_URL,
};

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use(async (req, res) => {
  const requestId = randomUUID();
  res.setHeader("x-request-id", requestId);
  const prefix = Object.keys(routes).find((p) => req.path.startsWith(p));
  const target = prefix ? routes[prefix] : undefined;
  if (!prefix || !target) return res.status(404).json({ message: "Unknown route", requestId });
  const upstream = `${target.replace(/\/$/, "")}${req.path.slice(prefix.length) || ""}${req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : ""}`;
  try {
    const headers: Record<string, string> = { "x-request-id": requestId, "content-type": "application/json" };
    if (req.headers.cookie) headers.cookie = req.headers.cookie;
    if (process.env.INTERNAL_API_TOKEN) headers["x-internal-token"] = process.env.INTERNAL_API_TOKEN;
    const r = await fetch(upstream, {
      method: req.method,
      headers,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : JSON.stringify(req.body ?? {}),
      signal: AbortSignal.timeout(20_000),
    });
    const text = await r.text();
    res.status(r.status);
    try { res.json(text ? JSON.parse(text) : {}); }
    catch { res.send(text); }
  } catch (e) {
    res.status(502).json({ message: e instanceof Error ? e.message : "Upstream failed", requestId });
  }
});
export default app;
