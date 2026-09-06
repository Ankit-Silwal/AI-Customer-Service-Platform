"use client";
import { useCallback, useEffect, useState } from "react";
import { api, type ChatMsg, type Conversation } from "../../lib/api";
import { useToast, useWorkspaces } from "../../lib/app-state";

const bubble = (t: string) =>
  t === "CUSTOMER" ? "b-customer" : t === "AI" ? "b-ai" : t === "AGENT" ? "b-agent" : "b-system";

export default function ConversationsPage() {
  const { push } = useToast();
  const { workspaces, activeId, reload } = useWorkspaces();
  const [list, setList] = useState<Conversation[]>([]);
  const [convId, setConvId] = useState("");
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [customerId, setCustomerId] = useState("customer-1");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [asRole, setAsRole] = useState<"CUSTOMER" | "AGENT">("CUSTOMER");
  const wsId = activeId || workspaces[0]?.id || "";

  const loadList = useCallback(async () => {
    if (!wsId) return;
    try { setList(await api.get<Conversation[]>(`/api/conversations?workspaceId=${wsId}`)); }
    catch (err) { push(err instanceof Error ? err.message : "Failed to load chats"); }
  }, [wsId, push]);

  const loadMsgs = useCallback(async (id: string) => {
    try { setMsgs(await api.get<ChatMsg[]>(`/api/conversations/${id}/messages`)); }
    catch (err) { push(err instanceof Error ? err.message : "Failed to load messages"); }
  }, [push]);

  useEffect(() => { reload(); }, [reload]);
  useEffect(() => { loadList(); }, [loadList]);
  useEffect(() => {
    if (!convId) return;
    loadMsgs(convId);
    const t = window.setInterval(() => loadMsgs(convId), 5000);
    return () => window.clearInterval(t);
  }, [convId, loadMsgs]);

  const send = async (withAI: boolean) => {
    if (!convId || !text.trim()) return;
    setSending(true);
    const content = text.trim();
    setText("");
    try {
      await api.post(`/api/conversations/${convId}/messages`, { senderType: asRole, content });
      if (withAI) {
        // Ask RAG, then store the cited answer as an AI message.
        const rag = await api.post<{ answer: string; sources: Array<{ content: string; score: number; documentId: string; filename: string }> }>(
          "/api/rag/query", { question: content, workspaceId: wsId, topK: 5 }
        );
        const cited = rag.sources.length > 0 ? `${rag.answer}` : rag.answer;
        await api.post(`/api/conversations/${convId}/messages`, { senderType: "AI", content: cited });
        try { await api.post("/api/analytics/events", { workspaceId: wsId, type: withAI ? "ai.answered" : "message.sent" }); } catch { /* non-fatal */ }
      }
      await loadMsgs(convId); await loadList();
    } catch (err) { push(err instanceof Error ? err.message : "Send failed"); }
    finally { setSending(false); }
  };

  const escalate = async () => {
    if (!convId) return;
    try {
      await api.post("/api/tickets", { workspaceId: wsId, conversationId: convId, title: `Escalation from chat ${convId.slice(0, 8)}`, priority: "HIGH" });
      await api.patch(`/api/conversations/${convId}`, { status: "WAITING" });
      try { await api.post("/api/analytics/events", { workspaceId: wsId, type: "ticket.escalated" }); } catch { /* non-fatal */ }
      push("Escalated — ticket created for a human");
      await loadList();
    } catch (err) { push(err instanceof Error ? err.message : "Escalation failed"); }
  };

  return (
    <main>
      <h2>Chats</h2>
      <p className="sub">Customer messages on the right, AI and agents on the left. Escalate when the AI can&apos;t help.</p>
      {!wsId && <div className="empty">Pick a <a href="/workspaces">workspace</a> first.</div>}
      <div className="toolbar">
        <div className="field"><span>Customer ID for new chats</span>
          <input className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)} />
        </div>
        <button className="btn btn-primary btn-sm" disabled={!wsId} onClick={async () => {
          try {
            const c = await api.post<Conversation>("/api/conversations", { workspaceId: wsId, customerId: customerId.trim() || "customer-1" });
            setConvId(c.id); await loadList(); push("Chat opened");
          } catch (err) { push(err instanceof Error ? err.message : "Open failed"); }
        }}>New chat</button>
      </div>
      <div className="chat-layout">
        <div className="card">
          <h3>Conversations ({list.length})</h3>
          {list.length === 0 ? <p className="hint">None yet.</p> : list.map((c) => (
            <button key={c.id} className={`conv-item${c.id === convId ? " active" : ""}`} onClick={() => setConvId(c.id)}>
              <b>{c.customerId}</b> <span className="badge b-gray">{c.status}</span><br />
              <code className="mono">{c.id.slice(0, 8)}</code>
            </button>
          ))}
        </div>
        <div className="card">
          {!convId ? <div className="empty">Select or start a conversation.</div> : (
            <>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <span className="badge b-blue">{list.find((c) => c.id === convId)?.status ?? ""}</span>
                <span style={{ flex: 1 }} />
                <button className="btn btn-ghost btn-sm" onClick={escalate}>Escalate to human</button>
                <button className="btn btn-ghost btn-sm" onClick={async () => {
                  try { await api.patch(`/api/conversations/${convId}`, { status: "RESOLVED" }); await loadList(); push("Marked resolved"); }
                  catch (err) { push(err instanceof Error ? err.message : "Failed"); }
                }}>Resolve</button>
              </div>
              <div className="chatbox">
                {msgs.map((m) => (
                  <div key={m.id} className={`bubble ${bubble(m.senderType)}`}>
                    <small>{m.senderType}</small>{m.content}
                  </div>
                ))}
                {msgs.length === 0 && <p className="hint">No messages yet — say hello.</p>}
              </div>
              <div className="toolbar" style={{ marginTop: 10 }}>
                <div className="field" style={{ minWidth: 120, maxWidth: 160 }}><span>Send as</span>
                  <select className="input" value={asRole} onChange={(e) => setAsRole(e.target.value as "CUSTOMER" | "AGENT")}>
                    <option value="CUSTOMER">Customer</option>
                    <option value="AGENT">Agent</option>
                  </select>
                </div>
                <div className="field"><span>Message</span>
                  <input className="input" value={text} onChange={(e) => setText(e.target.value)}
                    placeholder="Where is my refund?"
                    onKeyDown={(e) => { if (e.key === "Enter") send(asRole === "CUSTOMER"); }} />
                </div>
                <button className="btn btn-primary btn-sm" disabled={sending || !text.trim()} onClick={() => send(asRole === "CUSTOMER")}>
                  {sending ? "Sending…" : asRole === "CUSTOMER" ? "Send + AI answer" : "Send as agent"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
