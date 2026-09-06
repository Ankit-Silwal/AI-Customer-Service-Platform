"use client";
import { useState } from "react";
import { api } from "../../lib/api";

export default function AnalyticsPage() {
  const [workspaceId, setWorkspaceId] = useState("");
  const [data, setData] = useState<{ total: number; counts: Record<string, number> } | null>(null);
  const [msg, setMsg] = useState("");
  return (
    <main>
      <h2>Pulse<span className="sub">How much is AI resolving vs escalating?</span></h2>
      <form className="panel" onSubmit={(e) => {
        e.preventDefault();
        (async () => {
          try { setData(await api.get(`/api/analytics/metrics?workspaceId=${workspaceId}`)); setMsg(""); }
          catch (err) { setMsg(err instanceof Error ? err.message : "Failed"); }
        })();
      }}>
        <label>Workspace ID</label>
        <input value={workspaceId} onChange={(e) => setWorkspaceId(e.target.value)} />
        <button type="submit">Load metrics</button>
      </form>
      <p className="status">{msg}</p>
      {data && (
        <div className="card">
          <h3 style={{ margin: "0 0 8px" }}>{data.total} events</h3>
          {Object.entries(data.counts).map(([k, v]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0" }}>
              <span style={{ width: 180, fontSize: 13 }}>{k}</span>
              <div style={{ flex: 1, background: "#fbeed9", borderRadius: 6, height: 10 }}>
                <div style={{ width: `${data.total ? Math.round((v / data.total) * 100) : 0}%`, background: "linear-gradient(90deg,#d97706,#c05621)", height: 10, borderRadius: 6 }} />
              </div>
              <b>{v}</b>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
