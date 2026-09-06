import { Router } from "express";
import { queryRagController } from "./rag.controller.js";

const router = Router();

router.post("/query", queryRagController);

export default router;