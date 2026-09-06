import { z } from "zod";
export const createTicketSchema = z.object({
  workspaceId: z.string().min(1),
  conversationId: z.string().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
});
export const patchTicketSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assigneeId: z.string().nullable().optional(),
});
export const addNoteSchema = z.object({
  authorId: z.string().min(1),
  content: z.string().min(1).max(5000),
});
