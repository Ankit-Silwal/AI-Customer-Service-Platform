import type { Request, Response } from "express";
import { createWorkspace } from "./workspace.service.js";
import * as service from "./workspace.service.js";

function getUserId(req: Request) {
  return (
    (req as Request & { auth?: { user: { id: string } } }).auth?.user.id ??
    req.header("x-user-id")
  );
}

function getParam(req: Request, name: string) {
  const value = req.params[name];
  if (typeof value !== "string") throw new Error(`${name} is required`);
  return value;
}

async function handle(
  req: Request,
  res: Response,
  action: (userId: string) => Promise<unknown>,
  status = 200,
) {
  const userId = getUserId(req);
  if (!userId)
    return res.status(401).json({ message: "Authentication required" });
  try {
    return res.status(status).json(await action(userId));
  } catch (error) {
    return res
      .status(400)
      .json({
        message:
          error instanceof Error ? error.message : "Something went wrong",
      });
  }
}

export async function createWorkspaceController(req: Request, res: Response) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "User ID is required",
      });
    }
    const workspace = await createWorkspace(req.body, userId);
    return res.status(201).json(workspace);
  } catch (error) {
    return res.status(400).json({
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
}

export const listWorkspaceController = (req: Request, res: Response) =>
  handle(req, res, service.getWorkspaces);
export const getWorkspaceController = (req: Request, res: Response) =>
  handle(req, res, (id) =>
    service.getWorkspace(getParam(req, "workspaceId"), id),
  );
export const updateWorkspaceController = (req: Request, res: Response) =>
  handle(req, res, (id) =>
    service.editWorkspace(getParam(req, "workspaceId"), id, req.body),
  );
export const deleteWorkspaceController = (req: Request, res: Response) =>
  handle(req, res, (id) =>
    service.removeWorkspace(getParam(req, "workspaceId"), id),
  );
export const listMembersController = (req: Request, res: Response) =>
  handle(req, res, (id) =>
    service.getMembers(getParam(req, "workspaceId"), id),
  );
export const getMemberController = (req: Request, res: Response) =>
  handle(req, res, (id) =>
    service.getMemberById(
      getParam(req, "workspaceId"),
      getParam(req, "userId"),
      id,
    ),
  );
export const updateMemberRoleController = (req: Request, res: Response) =>
  handle(req, res, (id) =>
    service.changeMemberRole(
      getParam(req, "workspaceId"),
      getParam(req, "userId"),
      id,
      req.body,
    ),
  );
export const deleteMemberController = (req: Request, res: Response) =>
  handle(req, res, (id) =>
    service.removeMember(
      getParam(req, "workspaceId"),
      getParam(req, "userId"),
      id,
    ),
  );
export const leaveWorkspaceController = (req: Request, res: Response) =>
  handle(req, res, (id) =>
    service.leaveWorkspace(getParam(req, "workspaceId"), id),
  );
export const createInvitationController = (req: Request, res: Response) =>
  handle(
    req,
    res,
    (id) => service.inviteMember(getParam(req, "workspaceId"), id, req.body),
    201,
  );
export const listInvitationsController = (req: Request, res: Response) =>
  handle(req, res, (id) =>
    service.getInvitations(getParam(req, "workspaceId"), id),
  );
export const revokeInvitationController = (req: Request, res: Response) =>
  handle(req, res, (id) =>
    service.revokeInvitation(
      getParam(req, "workspaceId"),
      getParam(req, "invitationId"),
      id,
    ),
  );
export const acceptInvitationController = (req: Request, res: Response) =>
  handle(req, res, (id) =>
    service.respondToInvitation(getParam(req, "invitationId"), id, true),
  );
export const declineInvitationController = (req: Request, res: Response) =>
  handle(req, res, (id) =>
    service.respondToInvitation(getParam(req, "invitationId"), id, false),
  );
export const internalWorkspaceController = async (
  req: Request,
  res: Response,
) => res.json(await service.getInternalWorkspace(getParam(req, "workspaceId")));
export const internalMemberController = async (req: Request, res: Response) =>
  res.json(
    await service.getInternalMember(
      getParam(req, "workspaceId"),
      getParam(req, "userId"),
    ),
  );
export const internalPermissionsController = async (
  req: Request,
  res: Response,
) =>
  res.json(
    await service.getInternalPermissions(
      getParam(req, "workspaceId"),
      getParam(req, "userId"),
    ),
  );
