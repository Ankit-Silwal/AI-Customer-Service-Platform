"use client";
import { useState } from "react";
import { api } from "../../lib/api";

export default function TicketsPage() {
  const [workspaceId, setWorkspaceId] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [title, setTitle] = useState("");
  const [items, setItems] = useState<Array<{ id: string; title: string; status: string }>>([]);
  const [msg, setMsg] = useState("");
  return (
    <main>
      <h2>Human escalation<span className="sub">When AI can&apos;t help, a ticket reaches your team.</span></h2>
      <form className="panel" onSubmit={async (e) => {
        e.preventDefault();
        try {
          const t = await api.post("/api/tickets", { workspaceId, conversationId: conversationId || undefined, title, priority: "HIGH" });
          setMsg(`Ticket created`);
          void t;
        } catch (err) { setMsg(err instanceof Error ? err.message : "Failed"); }
      }}>
        <label>Workspace ID</label>
        <input value={workspaceId} onChange={(e) => setWorkspaceId(e.target.value)} />
        <label>Conversation ID (optional)</label>
        <input value={conversationId} onChange={(e) => setConversationId(e.target.value)} />
        <label>What does the customer need?</label>
        <input placeholder="Refund not received after 10 days" value={title} onChange={(e) => setTitle(e.target.value)} />
        <button type="submit">Escalate to human</button>
      </form>
      <button className="secondary" onClick={async () => {
        try { setItems(await api.get(`/api/tickets?workspaceId=${workspaceId}`)); setMsg(""); }
        catch (err) { setMsg(err instanceof Error ? err.message : "Failed"); }
      }}>List open tickets</button>
      <p className="status">{msg}</p>
      {items.map((t) => <div className="card" key={t.id}><b>{t.title}</b> <span className="pill">{t.status}</span><br /><code>{t.id}</code></div>)}
    </main>
  );
}
