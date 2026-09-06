export default function Home() {
  return (
    <main>
      {/* HERO */}
      <div className="hero">
        <span className="pill">AI agents for customer support teams</span>
        <h1 style={{ marginTop: 12 }}>Support that resolves itself — and knows when to ask for help</h1>
        <p>
          Warmdesk learns from your help docs, answers customers instantly across chat and email,
          routes tricky cases to the right human, and shows you what&apos;s working — all from one workspace.
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
          <a href="/register"><button>Start free</button></a>
          <a href="/conversations"><button className="secondary">See it in action</button></a>
        </div>
        <div className="steps">
          <div className="step"><b>Teach it</b>Upload PDFs, docs and FAQs. Warmdesk chunks, embeds and indexes them.</div>
          <div className="step"><b>Launch it</b>Customers chat; AI answers with citations from your own content.</div>
          <div className="step"><b>Trust it</b>Low-confidence questions become tickets for your agents — nothing goes unanswered.</div>
        </div>
      </div>

      {/* PLATFORM */}
      <h2>One platform, four teammates<span className="sub">Each agent maps to a service already running in this repo.</span></h2>
      <div className="grid2">
        <div className="card">
          <b>Insight Agent</b>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Surfaces gaps in your knowledge base and tracks resolution vs escalation trends over time.
          </p>
          <a href="/analytics">Open analytics →</a>
        </div>
        <div className="card">
          <b>Answer Agent</b>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Retrieves workspace-filtered context from your documents and drafts cited answers in seconds.
          </p>
          <a href="/conversations">Try a conversation →</a>
        </div>
        <div className="card">
          <b>Triage Agent</b>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Classifies incoming issues by priority, assigns them, and keeps a full audit trail of handoffs.
          </p>
          <a href="/tickets">View tickets →</a>
        </div>
        <div className="card">
          <b>Copilot for humans</b>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Agents see the same retrieved context the AI used — reply faster without leaving the thread.
          </p>
          <a href="/knowledge">Manage knowledge →</a>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <h2 style={{ marginTop: 32 }}>From upload to answer<span className="sub">The pipeline running under this page.</span></h2>
      <div className="card">
        <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 2 }}>
          <li><a href="/workspaces">Create a workspace</a> — your team&apos;s home base with roles.</li>
          <li><a href="/knowledge">Add a knowledge source</a> and upload files (private storage, workspace-scoped paths).</li>
          <li>Background worker extracts text, chunks it, embeds it, and stores vectors — status flips to <code>READY</code>.</li>
          <li><a href="/conversations">Open a chat</a> — each question searches only your workspace&apos;s vectors.</li>
          <li>Stuck? <a href="/tickets">Escalate to a ticket</a> with one click; resolve and watch <a href="/analytics">metrics</a> move.</li>
        </ol>
      </div>

      {/* CHANNELS */}
      <h2 style={{ marginTop: 32 }}>Meet customers where they are</h2>
      <div className="grid2">
        <div className="card"><b>Chat</b><p style={{ color: "var(--muted)", fontSize: 14 }}>Live on this site today — see Conversations.</p></div>
        <div className="card"><b>Email &amp; more</b><p style={{ color: "var(--muted)", fontSize: 14 }}>Notification hooks are ready; voice, Slack and headless API are on the roadmap.</p></div>
      </div>

      {/* CTA */}
      <div className="hero" style={{ marginTop: 32, textAlign: "center" }}>
        <h2 style={{ marginBottom: 8 }}>Give every customer an instant answer</h2>
        <p style={{ margin: "0 auto", maxWidth: 560 }}>Set up your first workspace in minutes. Bring one help doc — Warmdesk handles the rest.</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>
          <a href="/register"><button>Start free</button></a>
          <a href="/login"><button className="secondary">Log in</button></a>
        </div>
      </div>

      <footer style={{ marginTop: 32, paddingTop: 16, borderTop: "1px solid var(--border)", color: "var(--muted)", fontSize: 13, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <span><b style={{ color: "var(--text)" }}>Warmdesk</b> — student-built AI support platform</span>
        <a href="/workspaces">Product</a>
        <a href="/knowledge">Knowledge</a>
        <a href="/analytics">Analytics</a>
        <a href="/login">Sign in</a>
      </footer>
    </main>
  );
}
