import  Express  from "express";
import knowledgeRoutes from "./modules/knowledge/knowledge.routes.js";
import ragRoutes from "./modules/rag/rag.routes.js";

const app=Express();

app.disable("x-powered-by");
app.use(Express.json())

app.use("/knowledge",knowledgeRoutes);
app.use("/rag",ragRoutes);

// Multer fileFilter + size errors land here (they run before controllers).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Express.Request, res: Express.Response, _next: Express.NextFunction) => {
  const message = err instanceof Error ? err.message : "Upload failed";
  const status = /file|type|extension|large|limit/i.test(message) ? 400 : 500;
  res.status(status).json({ message });
});

export default app;
