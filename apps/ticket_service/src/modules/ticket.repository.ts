import prisma from "../config/prisma.js";
export const createTicket = (d: { workspaceId: string; conversationId?: string | undefined; title: string; description?: string | undefined; priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" }) =>
  prisma.ticket.create({
    data: {
      workspaceId: d.workspaceId,
      title: d.title,
      priority: d.priority,
      ...(d.conversationId !== undefined ? { conversationId: d.conversationId } : {}),
      ...(d.description !== undefined ? { description: d.description } : {}),
    },
  });
export const listTickets = (workspaceId: string) =>
  prisma.ticket.findMany({ where: { workspaceId }, orderBy: { updatedAt: "desc" }, take: 100 });
export const getTicket = (id: string) =>
  prisma.ticket.findUnique({ where: { id }, include: { notes: { orderBy: { createdAt: "asc" } } } });
export const patchTicket = (id: string, d: { status?: "OPEN" | "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED" | undefined; priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined; assigneeId?: string | null | undefined }) =>
  prisma.ticket.update({
    where: { id },
    data: {
      ...(d.status !== undefined ? { status: d.status } : {}),
      ...(d.priority !== undefined ? { priority: d.priority } : {}),
      ...(d.assigneeId !== undefined ? { assigneeId: d.assigneeId } : {}),
    },
  });
export const addNote = (ticketId: string, authorId: string, content: string) =>
  prisma.ticketNote.create({ data: { ticketId, authorId, content } });
