"use client";
import RequireAuth from "../../lib/require-auth";
import { useEffect, useState } from "react";
import { api, type Invitation, type Member, type Workspace } from "../../lib/api";
import { useToast, useWorkspaces } from "../../lib/app-state";

const roles = ["OWNER", "ADMIN", "AGENT", "VIEWER"];

export default function WorkspacesPage() {
  return (
    <RequireAuth>
      <WorkspacesPageInner />
    </RequireAuth>
  );
}

function WorkspacesPageInner() {
  const { push } = useToast();
  const { workspaces, activeId, setActiveId, reload } = useWorkspaces();
  const [name, setName] = useState("");
  const [detail, setDetail] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [inviteUser, setInviteUser] = useState("");
  const [inviteRole, setInviteRole] = useState("AGENT");
  const [rename, setRename] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { reload().finally(() => setLoading(false)); }, [reload]);

  const open = async (id: string) => {
    setActiveId(id);
    try {
      const [w, m] = await Promise.all([
        api.get<Workspace>(`/api/workspaces/${id}`),
        api.get<Member[]>(`/api/workspaces/${id}/members`),
      ]);
      setDetail(w); setRename(w.name);
      setMembers(m);
      try { setInvites(await api.get<Invitation[]>(`/api/workspaces/${id}/invitations`)); }
      catch { setInvites([]); }
    } catch (err) { push(err instanceof Error ? err.message : "Failed to open workspace"); }
  };

  return (
    <main>
      <h2>Workspaces</h2>
      <p className="sub">Create a workspace, manage members and invitations. Click a workspace to administer it.</p>
      <div className="toolbar">
        <div className="field"><span>New workspace name</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Support Operations" />
        </div>
        <button className="btn btn-primary" onClick={async () => {
          if (!name.trim()) return push("Name is required");
          try {
            const w = await api.post<Workspace>("/api/workspaces", { name: name.trim() });
            setName(""); await reload(); await open(w.id); push(`Created “${w.name}”`);
          } catch (err) { push(err instanceof Error ? err.message : "Create failed"); }
        }}>Create</button>
      </div>

      {loading ? (<><div className="skel" /><div className="skel" /></>) : workspaces.length === 0 ? (
        <div className="empty">No workspaces yet — create your first one above.</div>
      ) : (
        <table className="tbl">
          <thead><tr><th>Name</th><th>ID</th><th></th></tr></thead>
          <tbody>
            {workspaces.map((w) => (
              <tr key={w.id}>
                <td><b>{w.name}</b> {w.id === activeId && <span className="badge b-amber">active</span>}</td>
                <td><code className="mono" title={w.id}>{w.id.slice(0, 8)}…</code></td>
                <td><button className="btn btn-ghost btn-sm" onClick={() => open(w.id)}>Manage</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {detail && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3>{detail.name}</h3>
          <div className="toolbar">
            <div className="field"><span>Rename</span>
              <input className="input" value={rename} onChange={(e) => setRename(e.target.value)} />
            </div>
            <button className="btn btn-ghost btn-sm" onClick={async () => {
              try {
                const w = await api.patch<Workspace>(`/api/workspaces/${detail.id}`, { name: rename });
                setDetail(w); await reload(); push("Renamed");
              } catch (err) { push(err instanceof Error ? err.message : "Rename failed"); }
            }}>Save</button>
            <button className="btn btn-danger btn-sm" onClick={async () => {
              if (!window.confirm(`Delete “${detail.name}”?`)) return;
              try {
                await api.del(`/api/workspaces/${detail.id}`);
                setDetail(null); await reload(); push("Workspace deleted");
              } catch (err) { push(err instanceof Error ? err.message : "Delete failed"); }
            }}>Delete</button>
          </div>

          <h3>Members ({members.length})</h3>
          <table className="tbl">
            <thead><tr><th>User</th><th>Role</th><th></th></tr></thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.userId}>
                  <td><code className="mono">{m.userId}</code></td>
                  <td>
                    <select className="input" style={{ width: "auto" }} value={m.role} onChange={async (e) => {
                      try {
                        await api.patch(`/api/workspaces/${detail.id}/members/${m.userId}/role`, { role: e.target.value });
                        push("Role updated"); await open(detail.id);
                      } catch (err) { push(err instanceof Error ? err.message : "Role change failed"); }
                    }}>
                      {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={async () => {
                      try {
                        await api.del(`/api/workspaces/${detail.id}/members/${m.userId}`);
                        push("Member removed"); await open(detail.id);
                      } catch (err) { push(err instanceof Error ? err.message : "Remove failed"); }
                    }}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={{ marginTop: 16 }}>Invite a member</h3>
          <div className="toolbar">
            <div className="field"><span>User ID</span>
              <input className="input mono" value={inviteUser} onChange={(e) => setInviteUser(e.target.value)} placeholder="paste their user id" />
            </div>
            <div className="field"><span>Role</span>
              <select className="input" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                {roles.filter((r) => r !== "OWNER").map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <button className="btn btn-primary btn-sm" onClick={async () => {
              try {
                await api.post(`/api/workspaces/${detail.id}/invitations`, { userId: inviteUser.trim(), role: inviteRole });
                setInviteUser(""); push("Invitation sent"); await open(detail.id);
              } catch (err) { push(err instanceof Error ? err.message : "Invite failed"); }
            }}>Invite</button>
          </div>

          {invites.length > 0 && (
            <table className="tbl">
              <thead><tr><th>Invited user</th><th>Role</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {invites.map((inv) => (
                  <tr key={inv.id}>
                    <td><code className="mono">{inv.invitedUserId}</code></td>
                    <td>{inv.role}</td>
                    <td><span className="badge b-blue">{inv.status}</span></td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button className="btn btn-ghost btn-sm" onClick={async () => {
                        try { await api.post(`/api/invitations/${inv.id}/accept`, {}); push("Accepted"); await open(detail.id); }
                        catch (err) { push(err instanceof Error ? err.message : "Accept failed"); }
                      }}>Accept</button>{" "}
                      <button className="btn btn-ghost btn-sm" onClick={async () => {
                        try { await api.post(`/api/invitations/${inv.id}/decline`, {}); push("Declined"); await open(detail.id); }
                        catch (err) { push(err instanceof Error ? err.message : "Decline failed"); }
                      }}>Decline</button>{" "}
                      <button className="btn btn-danger btn-sm" onClick={async () => {
                        try { await api.del(`/api/workspaces/${detail.id}/invitations/${inv.id}`); push("Revoked"); await open(detail.id); }
                        catch (err) { push(err instanceof Error ? err.message : "Revoke failed"); }
                      }}>Revoke</button>
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
