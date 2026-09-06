import prisma from "../config/prisma.js";
export const createTicket = (d: { workspaceId: string; conversationId?: string; title: string; description?: string; priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" }) =>
  prisma.ticket.create({ data: d });
export const listTickets = (workspaceId: string) =>
  prisma.ticket.findMany({ where: { workspaceId }, orderBy: { updatedAt: "desc" }, take: 100 });
export const getTicket = (id: string) =>
  prisma.ticket.findUnique({ where: { id }, include: { notes: { orderBy: { createdAt: "asc" } } } });
export const patchTicket = (id: string, d: { status?: "OPEN" | "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED"; priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT"; assigneeId?: string | null }) =>
  prisma.ticket.update({ where: { id }, data: d });
export const addNote = (ticketId: string, authorId: string, content: string) =>
  prisma.ticketNote.create({ data: { ticketId, authorId, content } });
