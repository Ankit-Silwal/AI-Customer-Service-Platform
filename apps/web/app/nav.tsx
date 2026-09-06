"use client";
import { usePathname, useRouter } from "next/navigation";
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
  const router = useRouter();
  const { user, loading, refresh } = useSession();
  const { workspaces, activeId, setActiveId } = useWorkspaces();
  const active = workspaces.find((w) => w.id === activeId);
  const initial = (user?.name || user?.email || "?").trim().charAt(0).toUpperCase();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <a className="brand" href={user ? "/workspaces" : "/"}>
          <span className="brand-mark">W</span> Warmdesk
        </a>
        {/* App links only make sense logged in — logged-out users get the intro. */}
        {user && links.map(([label, href]) => (
          <a key={href} href={href} className={`navlink${path === href ? " active" : ""}`}>
            {label}
          </a>
        ))}
        <span className="navspacer" />
        {loading ? (
          <span className="navuser" aria-hidden><span className="skel skel-nav" /></span>
        ) : user ? (
          <>
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
            <span className="navuser" title={user.email}>
              <span className="avatar" aria-hidden>{initial}</span>
              {user.name}
            </span>
            <a
              className="navlink"
              href="#logout"
              onClick={async (e) => {
                e.preventDefault();
                try { await api.post("/api/identity/auth/logout", {}); } catch { /* ignore */ }
                try { window.localStorage.removeItem("warmdesk.ws"); } catch { /* ignore */ }
                await refresh();
                router.push("/login");
              }}
            >
              Log out
            </a>
          </>
        ) : (
          <>
            <a className="navlink" href="/login">Log in</a>
            <a className="btn btn-primary btn-sm" href="/register">Start free</a>
          </>
        )}
      </div>
    </nav>
  );
}
