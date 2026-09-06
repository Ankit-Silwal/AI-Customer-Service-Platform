"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "../../lib/api";
import { useSession } from "../../lib/app-state";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/workspaces";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const { user, loading: sessionLoading, refresh } = useSession();

  useEffect(() => {
    if (!sessionLoading && user) router.replace(next);
  }, [sessionLoading, user, router, next]);

  if (!sessionLoading && user) return null;

  return (
    <div className="auth-card">
      <span className="eyebrow">Sign in</span>
      <h2 style={{ marginTop: 0 }}>Welcome back</h2>
      <p className="sub">Log in to reach your workspaces, chats and tickets.</p>
      <form onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true); setMsg("");
        try {
          await api.post("/api/identity/auth/login", { email, password });
          await refresh();
          router.push(next);
        } catch (err) { setMsg(err instanceof Error ? err.message : "Login failed"); }
        finally { setBusy(false); }
      }}>
        <div className="field"><span>Email</span>
          <input className="input" autoComplete="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field"><span>Password</span>
          <input className="input" autoComplete="current-password" placeholder="••••••••" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>{busy ? "Signing in…" : "Log in"}</button>
        <span className="hint">New here? <a href="/register">Create an account</a>. Unverified emails can&apos;t log in yet.</span>
      </form>
      {msg && <div className="alert alert-err">{msg}</div>}
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="auth-wrap">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
