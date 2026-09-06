import  Express  from "express";
import knowledgeRoutes, { internalRouter } from "./modules/knowledge/knowledge.routes.js";

const app=Express();

app.use(Express.json())

app.use("/knowledge",knowledgeRoutes);
app.use("/internal",internalRouter);

export default app;
