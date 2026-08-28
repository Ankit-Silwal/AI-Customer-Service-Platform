import prisma from "../config/prisma.js";

export function findMember(workspaceId: string, userId: string) {
  return prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
}

export async function createWorkSpaceWithOwner(
  name:string,
  slug:string,
  userId:string
){
  return prisma.$transaction(async(tx)=>{
    const workspace=await tx.workspace.create({
      data:{
        name,
        slug
      }
    });
    await tx.workspaceMember.create({
      data:{
        workspaceId:workspace.id,
        userId,
        role:"OWNER"
      }
    })
    return workspace
  })
}

export const listWorkspaces = (userId: string) => prisma.workspace.findMany({
  where: { members: { some: { userId } } },
  include: { members: true },
  orderBy: { createdAt: "desc" },
});

export const getWorkspace = (workspaceId: string) => prisma.workspace.findUnique({
  where: { id: workspaceId },
  include: { members: true },
});

export const updateWorkspace = (workspaceId: string, data: { name?: string; slug?: string }) => prisma.workspace.update({
  where: { id: workspaceId },
  data,
});

export const deleteWorkspace = (workspaceId: string) => prisma.workspace.delete({ where: { id: workspaceId } });

export const listMembers = (workspaceId: string) => prisma.workspaceMember.findMany({
  where: { workspaceId },
  orderBy: { createdAt: "asc" },
});

export const updateMemberRole = (workspaceId: string, userId: string, role: "OWNER" | "ADMIN" | "AGENT" | "VIEWER") => prisma.workspaceMember.update({
  where: { workspaceId_userId: { workspaceId, userId } },
  data: { role },
});

export const deleteMember = (workspaceId: string, userId: string) => prisma.workspaceMember.delete({
  where: { workspaceId_userId: { workspaceId, userId } },
});

export const createInvitation = (workspaceId: string, invitedBy: string, data: { userId: string; role: "OWNER" | "ADMIN" | "AGENT" | "VIEWER" }) => prisma.workspaceInvitation.create({
  data: {
    workspaceId,
    invitedBy,
    invitedUserId: data.userId,
    role: data.role,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
});

export const listInvitations = (workspaceId: string) => prisma.workspaceInvitation.findMany({
  where: { workspaceId },
  orderBy: { createdAt: "desc" },
});

export const getInvitation = (invitationId: string) => prisma.workspaceInvitation.findUnique({ where: { id: invitationId } });

export const updateInvitation = (invitationId: string, status: "ACCEPTED" | "DECLINED" | "REVOKED") => prisma.workspaceInvitation.update({
  where: { id: invitationId },
  data: { status },
});

export const addMemberFromInvitation = (invitation: { workspaceId: string; invitedUserId: string; role: "OWNER" | "ADMIN" | "AGENT" | "VIEWER" }) => prisma.workspaceMember.upsert({
  where: { workspaceId_userId: { workspaceId: invitation.workspaceId, userId: invitation.invitedUserId } },
  update: { role: invitation.role },
  create: { workspaceId: invitation.workspaceId, userId: invitation.invitedUserId, role: invitation.role },
});

export const createAuditLog = async (workspaceId: string, actorUserId: string, action: string, targetUserId?: string, metadata?: object) => {
  const data: { workspaceId: string; actorUserId: string; action: string; targetUserId?: string; metadata?: object } = { workspaceId, actorUserId, action };
  if (targetUserId) data.targetUserId = targetUserId;
  if (metadata) data.metadata = metadata;
  return prisma.workspaceAuditLog.create({ data: data as never });
};