import { Router } from "express";
import { createWorkspaceController } from "./workspace.controller.js";

const router = Router();

router.post("/", createWorkspaceController);

export default router;