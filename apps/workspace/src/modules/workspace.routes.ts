import { Router } from "express";
import * as controller from "./workspace.controller.js";

const router = Router();

router.post("/", controller.createWorkspaceController);
router.get("/", controller.listWorkspaceController);
router.get("/:workspaceId", controller.getWorkspaceController);
router.patch("/:workspaceId", controller.updateWorkspaceController);
router.delete("/:workspaceId", controller.deleteWorkspaceController);
router.get("/:workspaceId/members", controller.listMembersController);
router.get("/:workspaceId/members/:userId", controller.getMemberController);
router.patch("/:workspaceId/members/:userId/role", controller.updateMemberRoleController);
router.delete("/:workspaceId/members/:userId", controller.deleteMemberController);
router.post("/:workspaceId/leave", controller.leaveWorkspaceController);
router.post("/:workspaceId/invitations", controller.createInvitationController);
router.get("/:workspaceId/invitations", controller.listInvitationsController);
router.delete("/:workspaceId/invitations/:invitationId", controller.revokeInvitationController);

export default router;