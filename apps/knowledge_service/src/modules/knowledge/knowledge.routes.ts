import { Router } from "express";
import {
	createKnowledgeSourceController,
	deleteDocumentController,
	deleteSourceController,
	getDocumentController,
	getSourceController,
	listDocumentsController,
	listSourcesController,
	renameSourceController,
	uploadDocumentController,
} from "./knowledge.controller.js";
import { upload } from "../../middleware/upload.middleware.js";

const router=Router()



router.post('/sources',createKnowledgeSourceController)
router.get('/sources',listSourcesController);
router.get('/sources/:sourceId',getSourceController);
router.patch('/sources/:sourceId',renameSourceController);
router.delete('/sources/:sourceId',deleteSourceController);
router.post('/documents',upload.single("file"),uploadDocumentController);
router.get('/documents',listDocumentsController);
router.get('/documents/:documentId',getDocumentController);
router.delete('/documents/:documentId',deleteDocumentController);
export default router;