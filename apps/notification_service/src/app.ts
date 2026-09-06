import express from "express";
import cors from "cors";
import { z } from "zod";
import { sendEmail } from "./config/mailer.js";

const app = express();
app.disable("x-powered-by");
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.get("/health", (_req, res) => res.json({ status: "ok" }));

const schema = z.object({
  type: z.enum(["invitation", "ticket", "assignment", "system"]),
  to: z.string().min(1),
  subject: z.string().min(1).max(200),
  text: z.string().min(1).max(10000),
});

// Other services POST here instead of sending email directly.
// BullMQ queue comes later; for now this endpoint sends (or logs) inline
// so the platform is runnable without extra workers.
app.post("/notifications", async (req, res) => {
  const p = schema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ message: p.error.issues[0]?.message });
  try {
    const r = await sendEmail(p.data.to, p.data.subject, p.data.text);
    res.status(202).json({ queued: true, ...r });
  } catch (e) {
    res.status(500).json({ message: e instanceof Error ? e.message : "Notify failed" });
  }
});
// JSON errors only: never leak Express HTML error pages through the gateway.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(400).json({ message: err instanceof Error ? err.message : "Something went wrong" });
});
export default app;
