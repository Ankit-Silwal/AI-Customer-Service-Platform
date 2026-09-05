import { Router } from "express";
import {
	createKnowledgeSourceController,
	uploadDocumentController,
} from "./knowledge.controller.js";
import { upload } from "../../middleware/upload.middleware.js";

const router=Router()



router.post('/sources',createKnowledgeSourceController)
router.post('/documents',upload.single("file"),uploadDocumentController);
export default router;