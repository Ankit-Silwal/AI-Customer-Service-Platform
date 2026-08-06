import { Router } from "express";
import {
	currentUserController,
	loginUserController,
	logoutUserController,
	registerUserController,
	verifyRegisterOtpController,
} from "./auth.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const authRouter = Router();

authRouter.post("/register", registerUserController);
authRouter.post("/login", loginUserController);
authRouter.post("/verify-otp", verifyRegisterOtpController);
authRouter.get("/me", requireAuth, currentUserController);
authRouter.post("/logout", requireAuth, logoutUserController);

export default authRouter;
