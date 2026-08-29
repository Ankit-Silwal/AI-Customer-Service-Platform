import  Express  from "express";
import knowledgeRoutes from "./modules/knowledge/knowledge.routes.js";

const app=Express();

app.use(Express.json())

app.use("/knowledge",knowledgeRoutes);

export default app;
