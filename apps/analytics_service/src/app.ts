import express from "express";
import cors from "cors";
import { z } from "zod";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const app = express();
app.disable("x-powered-by");
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Event-driven: services POST lightweight events; never query each other's DB.
app.post("/events", async (req, res) => {
  const p = z.object({ workspaceId: z.string().min(1), type: z.string().min(1).max(80) }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ message: p.error.issues[0]?.message });
  res.status(202).json(await prisma.metricEvent.create({ data: p.data }));
});

app.get("/metrics", async (req, res) => {
  const ws = String(req.query.workspaceId ?? "");
  if (!ws) return res.status(400).json({ message: "workspaceId required" });
  const groups = await prisma.metricEvent.groupBy({ by: ["type"], where: { workspaceId: ws }, _count: { type: true } });
  const counts: Record<string, number> = {};
  for (const g of groups) counts[g.type] = g._count.type;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  res.json({ workspaceId: ws, total, counts });
});
export default app;
