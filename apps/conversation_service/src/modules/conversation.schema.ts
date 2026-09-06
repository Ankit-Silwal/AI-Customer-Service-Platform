import { z } from "zod";

export const createConversationSchema = z.object({
  workspaceId: z.string().min(1),
  customerId: z.string().min(1),
});

export const updateConversationSchema = z.object({
  status: z.enum(["OPEN", "WAITING", "RESOLVED", "CLOSED"]).optional(),
  assignedAgentId: z.string().nullable().optional(),
});

export const createMessageSchema = z.object({
  senderType: z.enum(["CUSTOMER", "AI", "AGENT", "SYSTEM"]),
  senderId: z.string().optional(),
  content: z.string().min(1).max(10000),
});
