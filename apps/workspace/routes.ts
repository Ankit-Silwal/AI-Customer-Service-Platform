import { Router } from "express";
import workspaceRouter from "./src/modules/workspace.routes.js";

const rootRouter = Router();

rootRouter.get("/health", (_req, res) => {
	res.status(200).json({ status: "ok" });
});

rootRouter.use("/workspaces", workspaceRouter);

export default rootRouter;
