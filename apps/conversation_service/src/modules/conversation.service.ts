import * as repo from "./conversation.repository.js";

export const openConversation = async (workspaceId: string, customerId: string) => {
  if (!workspaceId.trim() || !customerId.trim()) throw new Error("workspaceId and customerId are required");
  return repo.createConversation({ workspaceId: workspaceId.trim(), customerId: customerId.trim() });
};

export const getConversations = (workspaceId: string) => repo.listConversations(workspaceId);

export const getConversationById = async (id: string) => {
  const c = await repo.getConversation(id);
  if (!c) throw new Error("Conversation not found");
  return c;
};

export const patchConversation = async (id: string, data: { status?: "OPEN" | "WAITING" | "RESOLVED" | "CLOSED" | undefined; assignedAgentId?: string | null | undefined }) => {
  await getConversationById(id);
  return repo.updateConversation(id, data);
};

export const postMessage = async (conversationId: string, msg: { senderType: "CUSTOMER" | "AI" | "AGENT" | "SYSTEM"; senderId?: string | undefined; content: string }) => {
  await getConversationById(conversationId);
  // AI answers are produced by callers (gateway/orchestrator) using rag_service;
  // this service only stores the message history. Escalation creates a ticket (ticket_service).
  return repo.createMessage({ conversationId, ...msg });
};
