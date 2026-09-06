"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useToast, useWorkspaces } from "../../lib/app-state";

export default function AnalyticsPage() {
  const { push } = useToast();
  const { workspaces, activeId, reload } = useWorkspaces();
  const [data, setData] = useState<{ total: number; counts: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(false);
  const wsId = activeId || workspaces[0]?.id || "";

  const load = useCallback(async () => {
    if (!wsId) return;
    setLoading(true);
    try { setData(await api.get(`/api/analytics/metrics?workspaceId=${wsId}`)); }
    catch (err) { push(err instanceof Error ? err.message : "Failed to load metrics"); }
    finally { setLoading(false); }
  }, [wsId, push]);

  useEffect(() => { reload(); }, [reload]);
  useEffect(() => { load(); }, [load]);

  const wsName = workspaces.find((w) => w.id === wsId)?.name ?? "";
  const entries = data ? Object.entries(data.counts).sort((a, b) => b[1] - a[1]) : [];

  return (
    <main>
      <h2>Pulse</h2>
      <p className="sub">
        {wsName ? <>Event counts for <b>{wsName}</b>. Services emit events (answers, escalations, resolutions) — nothing reads another service&apos;s database.</> : "Pick a workspace to see metrics."}
      </p>
      <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading || !wsId}>
        {loading ? "Loading…" : "Refresh"}
      </button>
      {loading ? (<><div className="skel" /><div className="skel" /></>) : !data || data.total === 0 ? (
        <div className="empty" style={{ marginTop: 12 }}>
          No events yet. Answer a chat, escalate a ticket or resolve one — then refresh.
        </div>
      ) : (
        <div className="grid2" style={{ marginTop: 12 }}>
          <div className="card">
            <h3>{data.total} total events</h3>
            {entries.map(([k, v]) => (
              <div key={k} className="bar">
                <span style={{ width: 170 }}>{k}</span>
                <div className="track"><div className="fill" style={{ width: `${Math.round((v / data.total) * 100)}%` }} /></div>
                <b>{v}</b>
              </div>
            ))}
          </div>
          <div className="card">
            <h3>What to read from this</h3>
            <p className="sub">
              <b>ai.answered</b> vs <b>ticket.escalated</b> is your self-serve rate.
              Rising <b>ticket.resolved</b> with flat escalations means the knowledge base is working.
            </p>
            <p className="hint">Tip: log a custom event from anywhere with POST /api/analytics/events {"{workspaceId, type}"}.</p>
          </div>
        </div>
      )}
    </main>
  );
}
