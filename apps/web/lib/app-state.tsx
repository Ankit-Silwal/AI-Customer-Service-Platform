"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, type SessionUser, type Workspace } from "./api";

/* ---------- toasts ---------- */
interface ToastCtx { push: (msg: string) => void }
const ToastContext = createContext<ToastCtx>({ push: () => undefined });
export const useToast = () => useContext(ToastContext);

export function ToastHost({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Array<{ id: number; msg: string }>>([]);
  const push = useCallback((msg: string) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, msg }]);
    window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);
  const value = useMemo(() => ({ push }), [push]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts">
        {items.map((t) => (
          <div key={t.id} className="toast">{t.msg}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ---------- session ---------- */
interface SessionCtx { user: SessionUser | null; loading: boolean; refresh: () => Promise<void> }
const SessionContext = createContext<SessionCtx>({ user: null, loading: true, refresh: async () => undefined });
export const useSession = () => useContext(SessionContext);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try {
      const data = await api.get<{ user: SessionUser }>("/api/identity/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const value = useMemo(() => ({ user, loading, refresh }), [user, loading, refresh]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/* ---------- active workspace ---------- */
interface WsCtx {
  workspaces: Workspace[];
  activeId: string;
  setActiveId: (id: string) => void;
  reload: () => Promise<void>;
}
const WsContext = createContext<WsCtx>({ workspaces: [], activeId: "", setActiveId: () => undefined, reload: async () => undefined });
export const useWorkspaces = () => useContext(WsContext);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeId, setActiveIdState] = useState("");
  const setActiveId = useCallback((id: string) => {
    setActiveIdState(id);
    try { window.localStorage.setItem("warmdesk.ws", id); } catch { /* ignore */ }
  }, []);
  const reload = useCallback(async () => {
    try {
      const list = await api.get<Workspace[]>("/api/workspaces");
      setWorkspaces(list);
      const saved = window.localStorage.getItem("warmdesk.ws") ?? "";
      if (list.length > 0 && !list.some((w) => w.id === (saved || activeId))) {
        setActiveId(list[0]!.id);
      } else if (saved && !activeId) {
        setActiveIdState(saved);
      }
    } catch {
      /* not logged in yet */
    }
  }, [activeId, setActiveId]);
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("warmdesk.ws") ?? "";
      if (saved) setActiveIdState(saved);
    } catch { /* ignore */ }
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const value = useMemo(() => ({ workspaces, activeId, setActiveId, reload }), [workspaces, activeId, setActiveId, reload]);
  return <WsContext.Provider value={value}>{children}</WsContext.Provider>;
}
