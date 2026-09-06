export default function Home() {
  return (
    <main style={{ padding: 32, fontFamily: "sans-serif" }}>
      <h1>AI Customer Service Platform</h1>
      <p>Frontend talks to the API gateway at <code>{process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}</code>.</p>
      <ul>
        <li>Identity → login, workspace → create, knowledge → upload</li>
        <li>Conversations → chat, tickets → escalation, analytics → metrics</li>
      </ul>
    </main>
  );
}
