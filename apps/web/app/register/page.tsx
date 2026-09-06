"use client";
import { useState } from "react";
import { api } from "../../lib/api";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  return (
    <main>
      <h2>Create your account<span className="sub">We&apos;ll email you a verification code.</span></h2>
      <form className="panel" onSubmit={async (e) => {
        e.preventDefault();
        try { await api.post("/api/identity/auth/register", { name, email, password }); setMsg("Registered — check your email for the OTP, then verify."); }
        catch (err) { setMsg(err instanceof Error ? err.message : "Failed"); }
      }}>
        <label>Name</label>
        <input placeholder="Ada Lovelace" value={name} onChange={(e) => setName(e.target.value)} />
        <label>Email</label>
        <input placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label>Password</label>
        <input placeholder="Strong password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">Create account</button>
      </form>
      <p className="status">{msg}</p>
    </main>
  );
}
