"use client";
import { useState } from "react";
import { api } from "../../lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  return (
    <main>
      <h2>Welcome back<span className="sub">Log in to your support workspace.</span></h2>
      <form className="panel" onSubmit={async (e) => {
        e.preventDefault();
        try { await api.post("/api/identity/auth/login", { email, password }); setOk(true); setMsg("Logged in — head to Workspaces."); }
        catch (err) { setOk(false); setMsg(err instanceof Error ? err.message : "Failed"); }
      }}>
        <label>Email</label>
        <input placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label>Password</label>
        <input placeholder="••••••••" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">Log in</button>
      </form>
      <p className={`status ${ok ? "ok" : ""}`}>{msg}</p>
    </main>
  );
}
