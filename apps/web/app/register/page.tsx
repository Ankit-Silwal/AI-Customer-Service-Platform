"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { useSession } from "../../lib/app-state";

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [conformPassword, setConform] = useState("");
  // Internal only: never rendered. The verify call needs it, the user doesn't.
  const [userId, setUserId] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"register" | "verify">("register");
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!sessionLoading && user) router.replace("/workspaces");
  }, [sessionLoading, user, router]);

  if (!sessionLoading && user) return null;

  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <span className="eyebrow">Get started</span>
        <h2 style={{ marginTop: 0 }}>Create your account</h2>
        <p className="sub">
          {step === "register"
            ? "One account for all your workspaces."
            : <>We sent a 6-digit code to <b>{email}</b>. Enter it below to verify your email.</>}
        </p>
        {step === "register" ? (
          <form onSubmit={async (e) => {
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
                <input className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="field"><span>Email</span>
                <input className="input" autoComplete="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="form-row">
              <div className="field"><span>Password</span>
                <input className="input" autoComplete="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="field"><span>Confirm password</span>
                <input className="input" autoComplete="new-password" type="password" value={conformPassword} onChange={(e) => setConform(e.target.value)} required />
              </div>
            </div>
            <button className="btn btn-primary btn-block" type="submit" disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
            <span className="hint">Already have an account? <a href="/login">Log in</a>.</span>
          </form>
        ) : (
          <form onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true); setMsg(""); setOk("");
            try {
              await api.post("/api/identity/auth/verify-otp", { userId, otp });
              setOk("Email verified — redirecting to login…");
              window.setTimeout(() => router.push("/login"), 900);
            } catch (err) { setMsg(err instanceof Error ? err.message : "Verification failed"); }
            finally { setBusy(false); }
          }}>
            <div className="field"><span>One-time code</span>
              <input className="input mono" inputMode="numeric" autoComplete="one-time-code" placeholder="6-digit code" value={otp} onChange={(e) => setOtp(e.target.value)} required />
            </div>
            <button className="btn btn-primary btn-block" type="submit" disabled={busy}>{busy ? "Verifying…" : "Verify email"}</button>
            <div className="cta-row">
              <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => { setStep("register"); setOtp(""); setMsg(""); setOk(""); }}>
                Use a different email
              </button>
              <a className="btn btn-ghost btn-sm" href="/login">Go to login</a>
            </div>
          </form>
        )}
        {msg && <div className="alert alert-err">{msg}</div>}
        {ok && <div className="alert alert-ok">{ok}</div>}
      </div>
    </main>
  );
}
