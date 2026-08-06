import { Router } from "express";
import authRouter from "./src/modules/auth/auth.routes.js";
import sessionRouter from "./src/modules/session/session.routes.js";

const rootRouter = Router();

rootRouter.get("/health", (_req, res) => {
	res.status(200).json({ status: "ok" });
});

rootRouter.use("/auth", authRouter);
rootRouter.use("/sessions", sessionRouter);

export default rootRouter;
