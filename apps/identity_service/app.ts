import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rootRouter from "./routes.js";
import { internalUserExistsController } from "./src/modules/auth/auth.controller.js";

const app = express();

app.disable("x-powered-by");

app.use(
	cors({
		origin: true,
		credentials: true,
	}),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/internal/users/:userId", internalUserExistsController);

app.use("/api", rootRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
	const message = error instanceof Error ? error.message : "Something went wrong";
	res.status(400).json({ message });
});

export default app;
