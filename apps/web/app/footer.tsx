"use client";
import { useSession } from "../lib/app-state";

export default function Footer() {
  const { user, loading } = useSession();
  return (
    <footer className="footer">
      <div className="footer-inner">
        <span><b style={{ color: "#ffedd5" }}>Warmdesk</b> — AI customer service, student-built.</span>
        <span style={{ flex: 1 }} />
        {user ? (
          <>
            <a href="/workspaces">Product</a>
            <a href="/knowledge">Knowledge</a>
            <a href="/analytics">Analytics</a>
          </>
        ) : (
          <>
            <a href="/#how">How it works</a>
            <a href="/register">Start free</a>
            {!loading && <a href="/login">Sign in</a>}
          </>
        )}
      </div>
    </footer>
  );
}
