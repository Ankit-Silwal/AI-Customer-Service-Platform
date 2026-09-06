"use client";
import { useState } from "react";
import { api } from "../../lib/api";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [conformPassword, setConform] = useState("");
  const [userId, setUserId] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"register" | "verify">("register");
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <main style={{ maxWidth: 520 }}>
      <span className="eyebrow">Get started</span>
      <h2 style={{ marginTop: 0 }}>Create your account</h2>
      {step === "register" ? (
        <form className="card" onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true); setMsg(""); setOk("");
          try {
            const r = await api.post<{ user: { id: string } }>("/api/identity/auth/register", { name, email, password, conformPassword });
            setUserId(r.user.id);
            setStep("verify");
            setOk("Account created — enter the code from your email.");
          } catch (err) { setMsg(err instanceof Error ? err.message : "Registration failed"); }
          finally { setBusy(false); }
        }}>
          <div className="form-row">
            <div className="field"><span>Name</span>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="field"><span>Email</span>
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>
          <div className="form-row">
            <div className="field"><span>Password</span>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="field"><span>Confirm password</span>
              <input className="input" type="password" value={conformPassword} onChange={(e) => setConform(e.target.value)} required />
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
        </form>
      ) : (
        <form className="card" onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true); setMsg(""); setOk("");
          try {
            await api.post("/api/identity/auth/verify-otp", { userId, otp });
            setOk("Email verified — you can now log in.");
          } catch (err) { setMsg(err instanceof Error ? err.message : "Verification failed"); }
          finally { setBusy(false); }
        }}>
          <div className="field"><span>User ID (from registration)</span>
            <input className="input mono" value={userId} onChange={(e) => setUserId(e.target.value)} required />
          </div>
          <div className="field"><span>One-time code</span>
            <input className="input mono" placeholder="6-digit code" value={otp} onChange={(e) => setOtp(e.target.value)} required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Verifying…" : "Verify email"}</button>
          <a className="btn btn-ghost" href="/login">Go to login</a>
        </form>
      )}
      {msg && <div className="alert alert-err">{msg}</div>}
      {ok && <div className="alert alert-ok">{ok}</div>}
    </main>
  );
}
