import { verifyUserExists } from "../config/identity.js";
import { createWorkSpaceWithOwner } from "./workspace.repository.js";
import * as repository from "./workspace.repository.js";
import type { createInvitationInput, createWorkSpaceInput, updateMemberRoleInput, updateWorkspaceInput } from "./workspace.types.js";

function createSlug(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function workspaceName(name: string) {
  const trimmed = name?.trim();
  if (!trimmed) throw new Error("Workspace name is required");
  const slug = createSlug(trimmed);
  if (!slug) throw new Error("Invalid workspace name");
  return { name: trimmed, slug };
}

async function authorize(workspaceId: string, userId: string, roles?: string[]) {
  const member = await repository.findMember(workspaceId, userId);
  if (!member) throw new Error("Workspace membership required");
  if (roles && !roles.includes(member.role)) throw new Error("Insufficient workspace permissions");
  return member;
}

export async function createWorkspace(data: createWorkSpaceInput, userId: string) {
  const { name, slug } = workspaceName(data.name);
  if (!(await verifyUserExists(userId))) throw new Error("User does not exist");
  return createWorkSpaceWithOwner(name, slug, userId);
}

export const getWorkspaces = (userId: string) => repository.listWorkspaces(userId);

export async function getWorkspace(workspaceId: string, userId: string) {
  await authorize(workspaceId, userId);
  return repository.getWorkspace(workspaceId);
}

export async function editWorkspace(workspaceId: string, userId: string, data: updateWorkspaceInput) {
  await authorize(workspaceId, userId, ["OWNER"]);
  const update = data.name === undefined ? {} : workspaceName(data.name);
  const workspace = await repository.updateWorkspace(workspaceId, update);
  await repository.createAuditLog(workspaceId, userId, "WORKSPACE_UPDATED", undefined, update);
  return workspace;
}

export async function removeWorkspace(workspaceId: string, userId: string) {
  await authorize(workspaceId, userId, ["OWNER"]);
  await repository.deleteWorkspace(workspaceId);
  return { message: "Workspace deleted" };
}

export const getMembers = async (workspaceId: string, userId: string) => { await authorize(workspaceId, userId); return repository.listMembers(workspaceId); };
export const getMemberById = async (workspaceId: string, targetUserId: string, userId: string) => { await authorize(workspaceId, userId); return repository.findMember(workspaceId, targetUserId); };

export async function changeMemberRole(workspaceId: string, targetUserId: string, userId: string, data: updateMemberRoleInput) {
  const actor = await authorize(workspaceId, userId, ["OWNER", "ADMIN"]);
  const target = await repository.findMember(workspaceId, targetUserId);
  if (target?.role === "OWNER" && actor.role !== "OWNER") throw new Error("Only the owner can change the owner role");
  if (data.role === "OWNER" && actor.role !== "OWNER") throw new Error("Only the owner can grant the owner role");
  if (targetUserId === userId && data.role !== "OWNER") throw new Error("Owners cannot remove their owner role");
  const member = await repository.updateMemberRole(workspaceId, targetUserId, data.role);
  await repository.createAuditLog(workspaceId, userId, "MEMBER_ROLE_UPDATED", targetUserId, { role: data.role });
  return member;
}

export async function removeMember(workspaceId: string, targetUserId: string, userId: string) {
  const actor = await authorize(workspaceId, userId, ["OWNER", "ADMIN"]);
  const target = await repository.findMember(workspaceId, targetUserId);
  if (target?.role === "OWNER" && actor.role !== "OWNER") throw new Error("Only the owner can remove the owner");
  if (target?.role === "OWNER") throw new Error("The owner cannot be removed");
  await repository.deleteMember(workspaceId, targetUserId);
  await repository.createAuditLog(workspaceId, userId, "MEMBER_REMOVED", targetUserId);
  return { message: "Member removed" };
}

export async function leaveWorkspace(workspaceId: string, userId: string) {
  const member = await authorize(workspaceId, userId);
  if (member.role === "OWNER") throw new Error("The owner cannot leave the workspace");
  await repository.deleteMember(workspaceId, userId);
  await repository.createAuditLog(workspaceId, userId, "MEMBER_LEFT", userId);
  return { message: "Left workspace" };
}

export async function inviteMember(workspaceId: string, userId: string, data: createInvitationInput) {
  const actor = await authorize(workspaceId, userId, ["OWNER", "ADMIN"]);
  if (data.role === "OWNER" && actor.role !== "OWNER") throw new Error("Only the owner can invite an owner");
  if (!(await verifyUserExists(data.userId))) throw new Error("User does not exist");
  const invitation = await repository.createInvitation(workspaceId, userId, { userId: data.userId, role: data.role ?? "AGENT" });
  await repository.createAuditLog(workspaceId, userId, "INVITATION_CREATED", data.userId);
  return invitation;
}

export const getInvitations = async (workspaceId: string, userId: string) => { await authorize(workspaceId, userId, ["OWNER", "ADMIN"]); return repository.listInvitations(workspaceId); };

export async function revokeInvitation(workspaceId: string, invitationId: string, userId: string) {
  await authorize(workspaceId, userId, ["OWNER", "ADMIN"]);
  const invitation = await repository.getInvitation(invitationId);
  if (!invitation || invitation.workspaceId !== workspaceId) throw new Error("Invitation not found");
  await repository.createAuditLog(workspaceId, userId, "INVITATION_REVOKED", invitation.invitedUserId);
  return repository.updateInvitation(invitationId, "REVOKED");
}

export async function respondToInvitation(invitationId: string, userId: string, accept: boolean) {
  const invitation = await repository.getInvitation(invitationId);
  if (!invitation || invitation.invitedUserId !== userId) throw new Error("Invitation not found");
  if (invitation.status !== "PENDING" || invitation.expiresAt < new Date()) throw new Error("Invitation is no longer active");
  if (!accept) return repository.updateInvitation(invitationId, "DECLINED");
  await repository.addMemberFromInvitation(invitation);
  return repository.updateInvitation(invitationId, "ACCEPTED");
}

export const getInternalWorkspace = (workspaceId: string) => repository.getWorkspace(workspaceId);
export const getInternalMember = (workspaceId: string, userId: string) => repository.findMember(workspaceId, userId);
export async function getInternalPermissions(workspaceId: string, userId: string) {
  const member = await repository.findMember(workspaceId, userId);
  const permissions = !member ? [] : member.role === "OWNER" ? ["manage_workspace", "manage_members", "manage_invitations"] : member.role === "ADMIN" ? ["manage_members", "manage_invitations"] : ["view_workspace"];
  return { workspaceId, userId, role: member?.role ?? null, permissions };
}