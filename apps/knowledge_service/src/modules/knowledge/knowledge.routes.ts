import { Router } from "express";
import { createKnowledgeSourceController } from "./knowledge.controller.js";

const router=Router()

router.post('/sources',createKnowledgeSourceController)

export default router;