"use client";
import RequireAuth from "../../lib/require-auth";
import { useCallback, useEffect, useState } from "react";
import { api, type Ticket } from "../../lib/api";
import { useToast, useWorkspaces } from "../../lib/app-state";

interface Note { id: string; authorId: string; content: string; createdAt: string }
interface TicketDetail extends Ticket { notes: Note[] }

const statusBadge = (s: string) =>
  s === "RESOLVED" || s === "CLOSED" ? "b-green" : s === "OPEN" ? "b-red" : "b-amber";
const prioBadge = (p: string) => (p === "URGENT" || p === "HIGH" ? "b-red" : p === "MEDIUM" ? "b-amber" : "b-gray");

function TicketsPageInner() {
  const { push } = useToast();
  const { workspaces, activeId, reload } = useWorkspaces();
  const [filter, setFilter] = useState("OPEN");
  const [items, setItems] = useState<Ticket[]>([]);
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("HIGH");
  const [note, setNote] = useState("");
  const [assignee, setAssignee] = useState("");
  const wsId = activeId || workspaces[0]?.id || "";

  const load = useCallback(async () => {
    if (!wsId) return;
    try { setItems(await api.get<Ticket[]>(`/api/tickets?workspaceId=${wsId}`)); }
    catch (err) { push(err instanceof Error ? err.message : "Failed to load tickets"); }
  }, [wsId, push]);

  useEffect(() => { reload(); }, [reload]);
  useEffect(() => { load(); }, [load]);

  const open = async (id: string) => {
    try { setDetail(await api.get<TicketDetail>(`/api/tickets/${id}`)); }
    catch (err) { push(err instanceof Error ? err.message : "Failed to open ticket"); }
  };

  const shown = filter === "ALL" ? items : items.filter((t) => t.status === filter);

  return (
    <main>
      <h2>Tickets</h2>
      <p className="sub">Human queue for everything the AI escalates. Notes keep the handoff in one place.</p>
      <div className="card">
        <h3>New escalation</h3>
        <div className="toolbar">
          <div className="field"><span>Title</span>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Refund not received after 10 days" />
          </div>
          <div className="field" style={{ maxWidth: 160 }}><span>Priority</span>
            <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
              {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <button className="btn btn-primary btn-sm" disabled={!wsId || !title.trim()} onClick={async () => {
            try {
              const t = await api.post<Ticket>("/api/tickets", { workspaceId: wsId, title: title.trim(), priority });
              setTitle(""); await load(); await open(t.id); push("Ticket created");
            } catch (err) { push(err instanceof Error ? err.message : "Create failed"); }
          }}>Create ticket</button>
        </div>
      </div>

      <div className="tabs">
        {["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED", "ALL"].map((s) => (
          <button key={s} className={`tab${filter === s ? " active" : ""}`} onClick={() => setFilter(s)}>{s.replace("_", " ")}</button>
        ))}
      </div>

      {shown.length === 0 ? <div className="empty" style={{ marginTop: 12 }}>No tickets in this view.</div> : (
        <table className="tbl" style={{ marginTop: 12 }}>
          <thead><tr><th>Title</th><th>Status</th><th>Priority</th><th></th></tr></thead>
          <tbody>
            {shown.map((t) => (
              <tr key={t.id}>
                <td><b>{t.title}</b><br /><code className="mono">{t.id.slice(0, 8)}</code></td>
                <td><span className={`badge ${statusBadge(t.status)}`}>{t.status}</span></td>
                <td><span className={`badge ${prioBadge(t.priority)}`}>{t.priority}</span></td>
                <td><button className="btn btn-ghost btn-sm" onClick={() => open(t.id)}>Open</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {detail && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>{detail.title}</h3>
          <p>
            <span className={`badge ${statusBadge(detail.status)}`}>{detail.status}</span>{" "}
            <span className={`badge ${prioBadge(detail.priority)}`}>{detail.priority}</span>{" "}
            {detail.assigneeId && <span className="badge b-blue">→ {detail.assigneeId.slice(0, 8)}</span>}
          </p>
          <div className="toolbar">
            <div className="field" style={{ maxWidth: 200 }}><span>Assign to (user id)</span>
              <input className="input mono" value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="user id" />
            </div>
            <button className="btn btn-ghost btn-sm" onClick={async () => {
              try {
                await api.post(`/api/tickets/${detail.id}/assign`, { assigneeId: assignee.trim() });
                setAssignee(""); await open(detail.id); await load(); push("Assigned");
              } catch (err) { push(err instanceof Error ? err.message : "Assign failed"); }
            }}>Assign + start</button>
            <button className="btn btn-primary btn-sm" onClick={async () => {
              try {
                await api.post(`/api/tickets/${detail.id}/resolve`, {});
                try { await api.post("/api/analytics/events", { workspaceId: wsId, type: "ticket.resolved" }); } catch { /* non-fatal */ }
                await open(detail.id); await load(); push("Resolved");
              } catch (err) { push(err instanceof Error ? err.message : "Resolve failed"); }
            }}>Resolve</button>
          </div>
          <h3>Internal notes ({detail.notes.length})</h3>
          <div className="timeline">
            {detail.notes.map((n) => (
              <div key={n.id} className="t-item">
                {n.content}
                <div className="t-meta">{n.authorId.slice(0, 8)} · {new Date(n.createdAt).toLocaleString()}</div>
              </div>
            ))}
            {detail.notes.length === 0 && <p className="hint">No notes yet.</p>}
          </div>
          <div className="toolbar" style={{ marginTop: 10 }}>
            <div className="field"><span>Add note (your user id is the author)</span>
              <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Customer called back, confirmed receipt…" />
            </div>
            <button className="btn btn-ghost btn-sm" disabled={!note.trim()} onClick={async () => {
              try {
                const me = await api.get<{ user: { id: string } }>("/api/identity/auth/me");
                await api.post(`/api/tickets/${detail.id}/notes`, { authorId: me.user.id, content: note.trim() });
                setNote(""); await open(detail.id); push("Note added");
              } catch (err) { push(err instanceof Error ? err.message : "Note failed"); }
            }}>Add note</button>
          </div>
        </div>
      )}
    </main>
  );
}

export default function TicketsPage() {
  return (
    <RequireAuth>
      <TicketsPageInner />
    </RequireAuth>
  );
}
