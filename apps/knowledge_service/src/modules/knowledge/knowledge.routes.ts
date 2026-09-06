import { Router } from "express";
import {
	createKnowledgeSourceController,
	deleteDocumentController,
	getDocumentController,
	listDocumentsController,
	uploadDocumentController,
} from "./knowledge.controller.js";
import { upload } from "../../middleware/upload.middleware.js";

const router=Router()



router.post('/sources',createKnowledgeSourceController)
router.post('/documents',upload.single("file"),uploadDocumentController);
router.get('/documents',listDocumentsController);
router.get('/documents/:documentId',getDocumentController);
router.delete('/documents/:documentId',deleteDocumentController);
export default router;