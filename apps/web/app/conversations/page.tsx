"use client";
import { useState } from "react";
import { api } from "../../lib/api";

type Msg = { id?: string; senderType: string; content: string };

const bubbleClass = (t: string) =>
  t === "CUSTOMER" ? "bubble customer" : t === "AI" ? "bubble ai" : t === "AGENT" ? "bubble agent" : "bubble system";

export default function ConversationsPage() {
  const [workspaceId, setWorkspaceId] = useState("");
  const [customerId, setCustomerId] = useState("customer-1");
  const [convId, setConvId] = useState("");
  const [text, setText] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [msg, setMsg] = useState("");

  const refresh = async (id: string) => setMsgs(await api.get(`/api/conversations/${id}/messages`));

  return (
    <main>
      <h2>Customer chats<span className="sub">AI answers first, humans step in when needed.</span></h2>
      <form className="panel" onSubmit={async (e) => {
        e.preventDefault();
        try { const c = await api.post("/api/conversations", { workspaceId, customerId }); setConvId(c.id); setMsg(`Conversation open`); }
        catch (err) { setMsg(err instanceof Error ? err.message : "Failed"); }
      }}>
        <label>Workspace ID</label>
        <input placeholder="paste workspace id" value={workspaceId} onChange={(e) => setWorkspaceId(e.target.value)} />
        <label>Customer ID</label>
        <input value={customerId} onChange={(e) => setCustomerId(e.target.value)} />
        <button type="submit">Open conversation</button>
      </form>
      <form className="panel" onSubmit={async (e) => {
        e.preventDefault();
        try {
          await api.post(`/api/conversations/${convId}/messages`, { senderType: "CUSTOMER", content: text });
          const rag = await api.post("/api/rag/query", { question: text, workspaceId, topK: 5 });
          await api.post(`/api/conversations/${convId}/messages`, { senderType: "AI", content: String(rag.answer ?? "") });
          setText(""); await refresh(convId);
        } catch (err) { setMsg(err instanceof Error ? err.message : "Failed"); }
      }}>
        <label>Conversation ID</label>
        <input placeholder="paste conversation id" value={convId} onChange={(e) => setConvId(e.target.value)} />
        <label>Customer message</label>
        <input placeholder="Where is my refund?" value={text} onChange={(e) => setText(e.target.value)} />
        <div>
          <button type="submit">Send + get AI answer</button>
          <button type="button" className="secondary" onClick={() => convId && refresh(convId)}>Refresh</button>
        </div>
      </form>
      <p className="status">{msg}</p>
      <div className="chat">
        {msgs.map((m, i) => (
          <div key={i} className={bubbleClass(m.senderType)}>
            <b>{m.senderType}</b>{m.content}
          </div>
        ))}
      </div>
    </main>
  );
}
