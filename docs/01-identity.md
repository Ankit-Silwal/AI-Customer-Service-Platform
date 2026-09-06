# 01 · Identity Service — “Who is this user?”

`apps/identity_service` · Express + Prisma 7 + PostgreSQL (`identity_db`) + Redis · **port 8000**

Owns: registration, bcrypt password hashing, OTP email verification (Redis TTL),
login/logout, Redis-backed sessions (`sessionId` httpOnly cookie), user profile.
Owns nothing else — no workspaces, roles, documents, chats or tickets.

## Data

- `User { id, name, email @unique, password (bcrypt), isEmailVerified, createdAt, updatedAt }`
- Redis: `OTP:<userId>` (TTL, single-use), `session:<sessionId> → userId`.

## Flows

**Register:** validate (`name,email,password,conformPassword`) → reject existing email →
bcrypt(10) → create user (`isEmailVerified=false`) → generate OTP → Redis →
Gmail → `201 { user, message }`.
**Verify:** `{ userId, otp }` → consume OTP (wrong/expired fails) → `isEmailVerified=true`.
**Login:** find by email → bcrypt compare → require verified → `createSession` →
`Set-Cookie: sessionId` + `200 { user, sessionId }`. Unverified users cannot log in.
**Me/Logout:** cookie → Redis session → user; logout deletes that session + clears cookie.

## Endpoints

| Method | Path | Notes |
|---|---|---|
| GET | `/api/health` | |
| POST | `/api/auth/register` | `{name,email,password,conformPassword}` |
| POST | `/api/auth/verify-otp` | `{userId,otp}` |
| POST | `/api/auth/login` | `{email,password}` → sets cookie |
| GET | `/api/auth/me` | cookie; → `{user, session}` |
| POST | `/api/auth/logout` | cookie; clears it |
| GET/DELETE | `/api/sessions/:userId…` | list/revoke sessions |
| GET | `/internal/users/:userId` | trusted lookup → `{exists}` (used by Workspace) |

## Env names

`DATABASE_URL` (…/identity_db), `REDIS_CLIENT_URL`, `SMTP_USER`, `SMTP_PASS` (Gmail app password), `PORT=8000`.

## Failure modes

- Weak/mismatched passwords → 400 with reason; duplicate email → 400.
- Expired/consumed OTP → 400; login before verify → 400 “verify your email”.
- Missing/expired session cookie → 401 on `/me`, `/logout`.
