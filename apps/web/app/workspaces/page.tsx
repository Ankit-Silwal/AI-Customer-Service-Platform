"use client";
import { useState } from "react";
import { api } from "../../lib/api";

export default function WorkspacesPage() {
  const [name, setName] = useState("");
  const [items, setItems] = useState<Array<{ id: string; name: string }>>([]);
  const [msg, setMsg] = useState("");
  return (
    <main>
      <h2>Workspaces<span className="sub">One workspace per business or team.</span></h2>
      <form className="panel" onSubmit={async (e) => {
        e.preventDefault();
        try { const w = await api.post("/api/workspaces/workspaces", { name }); setMsg(`Created “${w.name}”`); }
        catch (err) { setMsg(err instanceof Error ? err.message : "Failed"); }
      }}>
        <label>New workspace</label>
        <input placeholder="Support Operations" value={name} onChange={(e) => setName(e.target.value)} />
        <button type="submit">Create workspace</button>
      </form>
      <button className="secondary" onClick={async () => {
        try { setItems(await api.get("/api/workspaces/workspaces")); setMsg(""); }
        catch (err) { setMsg(err instanceof Error ? err.message : "Failed"); }
      }}>Refresh my workspaces</button>
      <p className="status">{msg}</p>
      {items.map((w) => <div className="card" key={w.id}><b>{w.name}</b> <span className="pill">{w.id.slice(0, 8)}</span><br /><code>{w.id}</code></div>)}
    </main>
  );
}
