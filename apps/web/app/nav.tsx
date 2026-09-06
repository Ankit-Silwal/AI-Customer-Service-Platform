"use client";
import { usePathname } from "next/navigation";
import { useSession, useWorkspaces } from "../lib/app-state";
import { api } from "../lib/api";

const links = [
  ["Workspaces", "/workspaces"],
  ["Knowledge", "/knowledge"],
  ["Chats", "/conversations"],
  ["Tickets", "/tickets"],
  ["Analytics", "/analytics"],
] as const;

export default function Nav() {
  const path = usePathname();
  const { user, loading, refresh } = useSession();
  const { workspaces, activeId, setActiveId } = useWorkspaces();
  const active = workspaces.find((w) => w.id === activeId);
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <a className="brand" href="/">
          <span className="brand-mark">W</span> Warmdesk
        </a>
        {links.map(([label, href]) => (
          <a key={href} href={href} className={`navlink${path === href ? " active" : ""}`}>
            {label}
          </a>
        ))}
        <span className="navspacer" />
        {active && <span className="ws-pill" title={active.id}>{active.name}</span>}
        {workspaces.length > 1 && (
          <select
            aria-label="Active workspace"
            className="input"
            style={{ width: "auto", padding: "5px 8px", fontSize: 12 }}
            value={activeId}
            onChange={(e) => setActiveId(e.target.value)}
          >
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        )}
        {loading ? (
          <span className="navuser">…</span>
        ) : user ? (
          <>
            <span className="navuser">{user.name}</span>
            <a
              className="navlink"
              href="#logout"
              onClick={async (e) => {
                e.preventDefault();
                await api.post("/api/identity/auth/logout", {});
                await refresh();
                window.location.href = "/login";
              }}
            >
              Log out
            </a>
          </>
        ) : (
          <>
            <a className="navlink" href="/login">Log in</a>
            <a className="navlink" href="/register">Register</a>
          </>
        )}
      </div>
    </nav>
  );
}
