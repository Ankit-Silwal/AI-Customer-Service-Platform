"use client";
import { useState } from "react";
import { api } from "../../lib/api";
import { useSession } from "../../lib/app-state";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const { refresh } = useSession();

  return (
    <main style={{ maxWidth: 480 }}>
      <span className="eyebrow">Sign in</span>
      <h2 style={{ marginTop: 0 }}>Welcome back</h2>
      <form className="card" onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true); setMsg("");
        try {
          await api.post("/api/identity/auth/login", { email, password });
          await refresh();
          window.location.href = "/workspaces";
        } catch (err) { setMsg(err instanceof Error ? err.message : "Login failed"); }
        finally { setBusy(false); }
      }}>
        <div className="field"><span>Email</span>
          <input className="input" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field"><span>Password</span>
          <input className="input" placeholder="••••••••" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Signing in…" : "Log in"}</button>
        <span className="hint">New here? <a href="/register">Create an account</a>. Unverified emails can&apos;t log in yet.</span>
      </form>
      {msg && <div className="alert alert-err">{msg}</div>}
    </main>
  );
}
