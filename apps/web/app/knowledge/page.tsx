"use client";
import { useCallback, useEffect, useState } from "react";
import { api, type Doc, type Source } from "../../lib/api";
import { useToast, useWorkspaces } from "../../lib/app-state";

const types = ["PDF", "DOCX", "WEBSITE", "FAQ"];
const statusBadge = (s: string) =>
  s === "READY" ? "b-green" : s === "FAILED" ? "b-red" : s === "PROCESSING" ? "b-blue" : "b-amber";

export default function KnowledgePage() {
  const { push } = useToast();
  const { workspaces, activeId, reload } = useWorkspaces();
  const [sources, setSources] = useState<Source[]>([]);
  const [sourceId, setSourceId] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("PDF");
  const [rename, setRename] = useState("");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [pct, setPct] = useState(0);
  const [busy, setBusy] = useState(false);

  const wsId = activeId || workspaces[0]?.id || "";

  const loadSources = useCallback(async () => {
    if (!wsId) return;
    try { setSources(await api.get<Source[]>(`/api/knowledge/sources?workspaceId=${wsId}`)); }
    catch (err) { push(err instanceof Error ? err.message : "Failed to load sources"); }
  }, [wsId, push]);

  const loadDocs = useCallback(async (sid: string) => {
    if (!sid) { setDocs([]); return; }
    try { setDocs(await api.get<Doc[]>(`/api/knowledge/documents?sourceId=${sid}`)); }
    catch (err) { push(err instanceof Error ? err.message : "Failed to load documents"); }
  }, [push]);

  useEffect(() => { reload(); }, [reload]);
  useEffect(() => { loadSources(); }, [loadSources]);

  // Poll while any doc is still processing.
  useEffect(() => {
    if (!docs.some((d) => d.status === "UPLOADED" || d.status === "PROCESSING")) return;
    const t = window.setInterval(() => { if (sourceId) loadDocs(sourceId); }, 4000);
    return () => window.clearInterval(t);
  }, [docs, sourceId, loadDocs]);

  return (
    <main>
      <h2>Knowledge</h2>
      <p className="sub">
        Sources group your content{wsId ? <> in <b>{workspaces.find((w) => w.id === wsId)?.name}</b></> : ""}.
        Uploads are embedded in the background — watch the status flip to READY.
      </p>
      {!wsId && <div className="empty">Create a <a href="/workspaces">workspace</a> first.</div>}

      <div className="grid2">
        <div className="card">
          <h3>New source</h3>
          <div className="field"><span>Name</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Refund policy docs" />
          </div>
          <div className="field"><span>Type</span>
            <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
              {types.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <button className="btn btn-primary btn-sm" disabled={!wsId || busy} onClick={async () => {
            if (!name.trim()) return push("Name is required");
            try {
              const s = await api.post<Source>("/api/knowledge/sources", { workspaceId: wsId, name: name.trim(), type });
              setName(""); setSourceId(s.id); setRename(s.name);
              await loadSources(); await loadDocs(s.id); push(`Source “${s.name}” created`);
            } catch (err) { push(err instanceof Error ? err.message : "Create failed"); }
          }}>Create source</button>
        </div>

        <div className="card">
          <h3>Upload document</h3>
          <div className="field"><span>Target source</span>
            <select className="input" value={sourceId} onChange={(e) => { setSourceId(e.target.value); loadDocs(e.target.value); }}>
              <option value="">— pick a source —</option>
              {sources.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.type})</option>)}
            </select>
          </div>
          <div className="field"><span>File (.pdf, .docx, .txt, .md — max 10MB)</span>
            <input className="input" type="file" accept=".pdf,.docx,.txt,.md" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          {pct > 0 && pct < 100 && <div className="progress"><div style={{ width: `${pct}%` }} /></div>}
          <button className="btn btn-primary btn-sm" disabled={!sourceId || !file || busy} onClick={async () => {
            if (!file) return;
            setBusy(true); setPct(1);
            try {
              const fd = new FormData();
              fd.append("sourceId", sourceId);
              fd.append("file", file);
              const d = await api.upload<{ document: Doc }>("/api/knowledge/documents", fd, setPct);
              setFile(null); setPct(0);
              await loadDocs(sourceId);
              push(`Uploaded — ${d.document.status} (polling for READY)`);
            } catch (err) { setPct(0); push(err instanceof Error ? err.message : "Upload failed"); }
            finally { setBusy(false); }
          }}>{busy ? "Uploading…" : "Upload & ingest"}</button>
        </div>
      </div>

      <h3 style={{ marginTop: 20 }}>Sources ({sources.length})</h3>
      {sources.length === 0 ? <div className="empty">No sources in this workspace yet.</div> : (
        <table className="tbl">
          <thead><tr><th>Name</th><th>Type</th><th></th></tr></thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s.id} style={s.id === sourceId ? { background: "#fff7ed" } : undefined}>
                <td><b>{s.name}</b><br /><code className="mono">{s.id}</code></td>
                <td><span className="badge b-blue">{s.type}</span></td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setSourceId(s.id); setRename(s.name); loadDocs(s.id); }}>Open</button>{" "}
                  <button className="btn btn-danger btn-sm" onClick={async () => {
                    if (!window.confirm(`Delete source “${s.name}” and all its documents?`)) return;
                    try {
                      await api.del(`/api/knowledge/sources/${s.id}`);
                      if (sourceId === s.id) { setSourceId(""); setDocs([]); }
                      await loadSources(); push("Source deleted");
                    } catch (err) { push(err instanceof Error ? err.message : "Delete failed"); }
                  }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {sourceId && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>Selected source</h3>
          <div className="toolbar">
            <div className="field"><span>Rename</span>
              <input className="input" value={rename} onChange={(e) => setRename(e.target.value)} />
            </div>
            <button className="btn btn-ghost btn-sm" onClick={async () => {
              try {
                await api.patch(`/api/knowledge/sources/${sourceId}`, { name: rename });
                await loadSources(); push("Renamed");
              } catch (err) { push(err instanceof Error ? err.message : "Rename failed"); }
            }}>Save</button>
          </div>
          <h3>Documents ({docs.length})</h3>
          {docs.length === 0 ? <div className="empty">No documents — upload one above.</div> : (
            <table className="tbl">
              <thead><tr><th>File</th><th>Status</th><th>Created</th><th></th></tr></thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id}>
                    <td><b>{d.filename}</b><br /><code className="mono">{d.id}</code></td>
                    <td><span className={`badge ${statusBadge(d.status)}`}>{d.status}</span></td>
                    <td className="hint">{new Date(d.createdAt).toLocaleString()}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={async () => {
                        if (!window.confirm(`Delete ${d.filename}?`)) return;
                        try { await api.del(`/api/knowledge/documents/${d.id}`); await loadDocs(sourceId); push("Document deleted"); }
                        catch (err) { push(err instanceof Error ? err.message : "Delete failed"); }
                      }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </main>
  );
}
