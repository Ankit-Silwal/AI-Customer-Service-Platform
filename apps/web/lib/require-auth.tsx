"use client";
import { useSession } from "./app-state";

/** Gate app pages behind login. Logged-out visitors get an intro + login wall
 *  instead of the tool UI (which would only show API 401s). */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSession();

  if (loading) {
    return (
      <main>
        <div className="skel" style={{ width: "40%" }} />
        <div className="skel" />
        <div className="skel" style={{ width: "70%" }} />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="auth-wrap">
        <div className="auth-card login-wall">
          <span className="eyebrow">Sign in required</span>
          <h2 style={{ marginTop: 0 }}>Log in to continue</h2>
          <p className="sub">
            Warmdesk workspaces are private to your team. Log in or create an account,
            then create a workspace, upload a help doc, and start chatting with your
            knowledge base.
          </p>
          <div className="cta-row">
            <a className="btn btn-primary" href="/login">Log in</a>
            <a className="btn btn-ghost" href="/register">Create account</a>
          </div>
          <span className="hint">New here? <a href="/">See how Warmdesk works</a>.</span>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
