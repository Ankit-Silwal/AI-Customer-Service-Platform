# 10 · Web — Next.js frontend (`:3000`)

`apps/web` · Next 16 (App Router) + React 19, no UI deps. Talks **only** to the
gateway (`NEXT_PUBLIC_API_URL`, see `.env.local`). Session cookie flows
automatically (`credentials: include`); gateway resolves the user.

## Pages

| Route | What works |
|---|---|
| `/` | Product landing: hero, interactive Answer/Triage/Insight tabs, pipeline, FAQ, CTA |
| `/login` | Email+password → session cookie → redirect to workspaces |
| `/register` | 2-step: create (`name,email,password,conformPassword`) → OTP verify (`userId` + code) |
| `/workspaces` | Create/rename/delete; members (role change/remove); invite/revoke/accept/decline |
| `/knowledge` | Source CRUD; upload with progress bar; doc table with READY polling (4s); delete |
| `/conversations` | Sidebar list; chat bubbles; send-as customer/agent; one-click RAG answer; escalate; resolve; 5s polling |
| `/tickets` | Status filter tabs; detail with assign/resolve; internal notes timeline |
| `/analytics` | Metric bars + reading guide; refresh; empty state |

Shared: `lib/api.ts` (typed client, XHR upload progress), `lib/app-state.tsx`
(session, workspace switcher in localStorage, toasts), warm design system in
`app/globals.css`, auth-aware nav (`app/nav.tsx`).

Run: `npm install`, `npm run dev` (`:3000`), `npm run build` to verify.
