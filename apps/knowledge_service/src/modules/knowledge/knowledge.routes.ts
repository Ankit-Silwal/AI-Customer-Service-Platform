import { Router } from "express";
import {
	createKnowledgeSourceController,
	getDocumentController,
	uploadDocumentController,
} from "./knowledge.controller.js";
import { upload } from "../../middleware/upload.middleware.js";

const router=Router()



router.post('/sources',createKnowledgeSourceController)
router.post('/documents',upload.single("file"),uploadDocumentController);

export const internalRouter = Router();
internalRouter.get('/documents/:docId',getDocumentController);

export default router;