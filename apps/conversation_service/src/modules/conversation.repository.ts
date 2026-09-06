import prisma from "../config/prisma.js";

export const createConversation = (data: { workspaceId: string; customerId: string }) =>
  prisma.conversation.create({ data });

export const listConversations = (workspaceId: string) =>
  prisma.conversation.findMany({ where: { workspaceId }, orderBy: { updatedAt: "desc" }, take: 100 });

export const getConversation = (id: string) =>
  prisma.conversation.findUnique({ where: { id } });

export const updateConversation = (id: string, data: { status?: "OPEN" | "WAITING" | "RESOLVED" | "CLOSED" | undefined; assignedAgentId?: string | null | undefined }) =>
  prisma.conversation.update({
    where: { id },
    data: {
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.assignedAgentId !== undefined ? { assignedAgentId: data.assignedAgentId } : {}),
    },
  });

export const listMessages = (conversationId: string) =>
  prisma.message.findMany({ where: { conversationId }, orderBy: { createdAt: "asc" }, take: 500 });

export const createMessage = (data: { conversationId: string; senderType: "CUSTOMER" | "AI" | "AGENT" | "SYSTEM"; senderId?: string | undefined; content: string }) =>
  prisma.$transaction(async (tx) => {
    const msg = await tx.message.create({
      data: {
        conversationId: data.conversationId,
        senderType: data.senderType,
        content: data.content,
        ...(data.senderId !== undefined ? { senderId: data.senderId } : {}),
      },
    });
    await tx.conversation.update({ where: { id: data.conversationId }, data: { updatedAt: new Date() } });
    return msg;
  });
