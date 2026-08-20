import { Router } from "express";
import workspaceRouter from "./src/modules/workspace.routes.js";
import * as controller from "./src/modules/workspace.controller.js";

const rootRouter = Router();

rootRouter.get("/health", (_req, res) => {
	res.status(200).json({ status: "ok" });
});

rootRouter.use("/workspaces", workspaceRouter);
rootRouter.post("/invitations/:invitationId/accept", controller.acceptInvitationController);
rootRouter.post("/invitations/:invitationId/decline", controller.declineInvitationController);
rootRouter.get("/internal/workspaces/:workspaceId", controller.internalWorkspaceController);
rootRouter.get("/internal/workspaces/:workspaceId/members/:userId", controller.internalMemberController);
rootRouter.get("/internal/workspaces/:workspaceId/permissions/:userId", controller.internalPermissionsController);

export default rootRouter;
