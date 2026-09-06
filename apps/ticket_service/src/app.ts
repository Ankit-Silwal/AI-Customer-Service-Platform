import express from "express";
import cors from "cors";
import { z } from "zod";
import * as repo from "./modules/ticket.repository.js";
import { addNoteSchema, createTicketSchema, patchTicketSchema } from "./modules/ticket.schema.js";

const app = express();
app.disable("x-powered-by");
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.get("/health", (_req, res) => res.json({ status: "ok" }));

const bad = (res: express.Response, e: unknown) => {
  const m = e instanceof Error ? e.message : "Failed";
  res.status(/not found/i.test(m) ? 404 : 400).json({ message: m });
};

app.post("/tickets", async (req, res) => {
  const p = createTicketSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ message: p.error.issues[0]?.message });
  try { res.status(201).json(await repo.createTicket(p.data)); }
  catch (e) { bad(res, e); }
});
app.get("/tickets", async (req, res) => {
  const ws = String(req.query.workspaceId ?? "");
  if (!ws) return res.status(400).json({ message: "workspaceId required" });
  res.json(await repo.listTickets(ws));
});
app.get("/tickets/:id", async (req, res) => {
  const t = await repo.getTicket(String(req.params.id));
  if (!t) return res.status(404).json({ message: "Ticket not found" });
  res.json(t);
});
app.patch("/tickets/:id", async (req, res) => {
  const p = patchTicketSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ message: p.error.issues[0]?.message });
  try { res.json(await repo.patchTicket(String(req.params.id), p.data)); }
  catch (e) { bad(res, e); }
});
app.post("/tickets/:id/assign", async (req, res) => {
  const p = z.object({ assigneeId: z.string().min(1) }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ message: "assigneeId required" });
  try { res.json(await repo.patchTicket(String(req.params.id), { assigneeId: p.data.assigneeId, status: "IN_PROGRESS" })); }
  catch (e) { bad(res, e); }
});
app.post("/tickets/:id/notes", async (req, res) => {
  const p = addNoteSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ message: p.error.issues[0]?.message });
  try { res.status(201).json(await repo.addNote(String(req.params.id), p.data.authorId, p.data.content)); }
  catch (e) { bad(res, e); }
});
app.post("/tickets/:id/resolve", async (req, res) => {
  try { res.json(await repo.patchTicket(String(req.params.id), { status: "RESOLVED" })); }
  catch (e) { bad(res, e); }
});
// Escalation entry: AI/orchestrator calls POST /tickets with conversationId + HIGH priority.
// JSON errors only: never leak Express HTML error pages through the gateway.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(400).json({ message: err instanceof Error ? err.message : "Something went wrong" });
});
export default app;
