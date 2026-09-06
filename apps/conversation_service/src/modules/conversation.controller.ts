import type { Request, Response } from "express";
import { createConversationSchema, createMessageSchema, updateConversationSchema } from "./conversation.schema.js";
import * as service from "./conversation.service.js";

const err = (res: Response, error: unknown, fallback: string, notFound = true) => {
  const msg = error instanceof Error ? error.message : fallback;
  const status = notFound && /not found/i.test(msg) ? 404 : 400;
  return res.status(status).json({ message: msg });
};

export const createConversationController = async (req: Request, res: Response) => {
  const p = createConversationSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ message: p.error.issues[0]?.message });
  try {
    return res.status(201).json(await service.openConversation(p.data.workspaceId, p.data.customerId));
  } catch (e) { return err(res, e, "Failed to create conversation", false); }
};

export const listConversationsController = async (req: Request, res: Response) => {
  const ws = String(req.query.workspaceId ?? "");
  if (!ws) return res.status(400).json({ message: "workspaceId query is required" });
  try {
    return res.json(await service.getConversations(ws));
  } catch (e) { return err(res, e, "Failed to list", false); }
};

export const getConversationController = async (req: Request, res: Response) => {
  try {
    return res.json(await service.getConversationById(String(req.params.id)));
  } catch (e) { return err(res, e, "Failed"); }
};

export const patchConversationController = async (req: Request, res: Response) => {
  const p = updateConversationSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ message: p.error.issues[0]?.message });
  try {
    return res.json(await service.patchConversation(String(req.params.id), p.data));
  } catch (e) { return err(res, e, "Failed"); }
};

export const listMessagesController = async (req: Request, res: Response) => {
  try {
    await service.getConversationById(String(req.params.id));
    const { listMessages } = await import("./conversation.repository.js");
    return res.json(await listMessages(String(req.params.id)));
  } catch (e) { return err(res, e, "Failed"); }
};

export const postMessageController = async (req: Request, res: Response) => {
  const p = createMessageSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ message: p.error.issues[0]?.message });
  try {
    return res.status(201).json(await service.postMessage(String(req.params.id), p.data));
  } catch (e) { return err(res, e, "Failed"); }
};
