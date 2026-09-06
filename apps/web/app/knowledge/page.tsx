"use client";
import { useState } from "react";
import { api } from "../../lib/api";

export default function KnowledgePage() {
  const [workspaceId, setWorkspaceId] = useState("");
  const [name, setName] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState("");
  return (
    <main>
      <h2>Knowledge<span className="sub">Teach the AI with PDFs, docs and notes.</span></h2>
      <div className="grid2">
        <form className="panel" onSubmit={async (e) => {
          e.preventDefault();
          try {
            const s = await api.post("/api/knowledge/sources", { workspaceId, name, type: "PDF" });
            setSourceId(s.id); setMsg(`Source ready: ${s.name}`);
          } catch (err) { setMsg(err instanceof Error ? err.message : "Failed"); }
        }}>
          <label>Workspace ID</label>
          <input placeholder="paste workspace id" value={workspaceId} onChange={(e) => setWorkspaceId(e.target.value)} />
          <label>Source name</label>
          <input placeholder="Refund policy docs" value={name} onChange={(e) => setName(e.target.value)} />
          <button type="submit">Create source</button>
        </form>
        <form className="panel" onSubmit={async (e) => {
          e.preventDefault();
          if (!file) return setMsg("Pick a file first");
          try {
            const fd = new FormData();
            fd.append("sourceId", sourceId);
            fd.append("file", file);
            const d = await api.upload("/api/knowledge/documents", fd);
            setMsg(`Uploaded — status ${d.document?.status}. Ingestion runs in background.`);
          } catch (err) { setMsg(err instanceof Error ? err.message : "Failed"); }
        }}>
          <label>Source ID</label>
          <input placeholder="paste source id" value={sourceId} onChange={(e) => setSourceId(e.target.value)} />
          <label>File (.pdf, .docx, .txt, .md — max 10MB)</label>
          <input type="file" accept=".pdf,.docx,.txt,.md" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <button type="submit">Upload document</button>
        </form>
      </div>
      <p className="status">{msg}</p>
    </main>
  );
}
