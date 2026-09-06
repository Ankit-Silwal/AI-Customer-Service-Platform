import express from "express";
import cors from "cors";
import router from "./modules/conversation.routes.js";

const app = express();
app.disable("x-powered-by");
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/conversations", router);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(400).json({ message: err instanceof Error ? err.message : "Something went wrong" });
});
export default app;
