import prisma from "../config/prisma.js";

export const createConversation = (data: { workspaceId: string; customerId: string }) =>
  prisma.conversation.create({ data });

export const listConversations = (workspaceId: string) =>
  prisma.conversation.findMany({ where: { workspaceId }, orderBy: { updatedAt: "desc" }, take: 100 });

export const getConversation = (id: string) =>
  prisma.conversation.findUnique({ where: { id } });

export const updateConversation = (id: string, data: { status?: "OPEN" | "WAITING" | "RESOLVED" | "CLOSED"; assignedAgentId?: string | null }) =>
  prisma.conversation.update({ where: { id }, data });

export const listMessages = (conversationId: string) =>
  prisma.message.findMany({ where: { conversationId }, orderBy: { createdAt: "asc" }, take: 500 });

export const createMessage = (data: { conversationId: string; senderType: "CUSTOMER" | "AI" | "AGENT" | "SYSTEM"; senderId?: string; content: string }) =>
  prisma.$transaction(async (tx) => {
    const msg = await tx.message.create({ data });
    await tx.conversation.update({ where: { id: data.conversationId }, data: { updatedAt: new Date() } });
    return msg;
  });
