"use client";
import { useState } from "react";

const demos = {
  answer: [
    { who: "Customer", text: "Do you offer refunds on annual plans within 30 days?" },
    { who: "Warmdesk AI · cited", text: "Yes — annual plans can be refunded in full within 30 days of purchase. [1]", cite: "[1] Refund Policy.pdf · chunk 4 · score 0.91" },
  ],
  triage: [
    { who: "Incoming", text: "“Charged twice this month, need this fixed today”" },
    { who: "Triage", text: "Priority HIGH → billing queue → agent Maya assigned. Customer notified." },
  ],
  insight: [
    { who: "Insight", text: "14 chats this week asked about SSO setup — no article covers it." },
    { who: "Suggestion", text: "Draft “SSO setup guide” from these 14 threads? One click creates the source." },
  ],
} as const;

type DemoKey = keyof typeof demos;

export default function Home() {
  const [tab, setTab] = useState<DemoKey>("answer");
  return (
    <main>
      <div className="hero">
        <span className="eyebrow">AI agents for customer support teams</span>
        <h1>Every customer question, answered or assigned in seconds</h1>
        <p className="lead">
          Warmdesk learns from your help docs, answers customers with cited sources, routes the
          hard cases to the right human, and shows you exactly what improved.
        </p>
        <div className="cta-row">
          <a className="btn btn-primary" href="/register">Start free</a>
          <a className="btn btn-ghost" href="/conversations">Try a live chat</a>
        </div>
        <div className="tabs" role="tablist">
          {(Object.keys(demos) as DemoKey[]).map((k) => (
            <button key={k} role="tab" className={`tab${tab === k ? " active" : ""}`} onClick={() => setTab(k)}>
              {k === "answer" ? "Answer" : k === "triage" ? "Triage" : "Insight"}
            </button>
          ))}
        </div>
        <div className="demo">
          {demos[tab].map((m, i) => (
            <div key={i}>
              <div className="who">{m.who}</div>
              <div className="msg">{m.text}</div>
              {"cite" in m && m.cite ? <div className="cite">{m.cite}</div> : null}
            </div>
          ))}
        </div>
      </div>

      <h2>One platform, four teammates</h2>
      <p className="sub">Each agent maps to a service already running in this repository.</p>
      <div className="grid3">
        <div className="card"><h3>Answer Agent</h3><p className="sub">Workspace-filtered retrieval with cited answers.</p><a href="/conversations">Try a conversation →</a></div>
        <div className="card"><h3>Triage Agent</h3><p className="sub">Priority, assignment and a full handoff trail.</p><a href="/tickets">View tickets →</a></div>
        <div className="card"><h3>Insight Agent</h3><p className="sub">Resolution vs escalation trends per workspace.</p><a href="/analytics">Open analytics →</a></div>
      </div>

      <h2>From upload to answer</h2>
      <p className="sub">The pipeline running underneath this page.</p>
      <div className="card">
        <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 2 }}>
          <li><a href="/workspaces">Create a workspace</a> — your team&apos;s home base with roles.</li>
          <li><a href="/knowledge">Add a knowledge source</a> and upload files (private storage, workspace-scoped paths).</li>
          <li>A background worker extracts, chunks, embeds and indexes — watch the status flip to <code className="mono">READY</code>.</li>
          <li><a href="/conversations">Open a chat</a> — every question searches only your workspace&apos;s vectors.</li>
          <li>Stuck? <a href="/tickets">Escalate to a ticket</a>, resolve, and check <a href="/analytics">metrics</a>.</li>
        </ol>
      </div>

      <h2>Questions, answered honestly</h2>
      <details className="faq" open>
        <summary>Where does my data live?</summary>
        <p>Files in private Supabase storage, metadata in per-service Postgres databases, vectors in Qdrant — always filtered by workspace ID. No cross-workspace retrieval, ever.</p>
      </details>
      <details className="faq">
        <summary>What happens when the AI doesn&apos;t know?</summary>
        <p>It says so and creates a ticket with the full conversation attached, so a human picks up with context instead of starting over.</p>
      </details>
      <details className="faq">
        <summary>Is this production software?</summary>
        <p>It&apos;s a learning build with real architecture: separate services, queues, and auth. Harden auth, rate limits and backups before putting real customers on it.</p>
      </details>

      <div className="hero" style={{ marginTop: 32, textAlign: "center" }}>
        <h2 style={{ marginTop: 0 }}>Give every customer an instant answer</h2>
        <p className="sub" style={{ margin: "0 auto 8px" }}>Bring one help doc — Warmdesk handles the rest.</p>
        <div className="cta-row" style={{ justifyContent: "center" }}>
          <a className="btn btn-primary" href="/register">Start free</a>
          <a className="btn btn-ghost" href="/login">Log in</a>
        </div>
      </div>
    </main>
  );
}
