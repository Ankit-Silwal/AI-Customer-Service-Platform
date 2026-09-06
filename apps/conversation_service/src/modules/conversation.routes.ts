import { Router } from "express";
import * as c from "./conversation.controller.js";

const router = Router();
router.post("/", c.createConversationController);
router.get("/", c.listConversationsController);
router.get("/:id", c.getConversationController);
router.patch("/:id", c.patchConversationController);
router.get("/:id/messages", c.listMessagesController);
router.post("/:id/messages", c.postMessageController);
export default router;
