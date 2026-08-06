import { Router } from "express";
import {
  deleteAllSessionsController,
  deleteSessionController,
  deleteSpecificSessionController,
  getSessionsController,
} from "./session.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const sessionRouter = Router();

sessionRouter.use(requireAuth);
sessionRouter.get("/:userId", getSessionsController);
sessionRouter.delete("/:userId", deleteSessionController);
sessionRouter.delete("/:userId/all", deleteAllSessionsController);
sessionRouter.delete("/:userId/:sessionId", deleteSpecificSessionController);

export default sessionRouter;