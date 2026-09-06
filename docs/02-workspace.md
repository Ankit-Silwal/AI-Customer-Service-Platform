# 02 · Workspace Service — “What can this user do here?”

`apps/workspace_service` · Express + Prisma · PostgreSQL (`workplace`) · **port 7999 (hardcoded in `index.ts`)**

Owns workspaces, memberships, invitations, audit log. **Role lives on
`WorkspaceMember`, never on `User`.** `member.userId` is a logical copy of
Identity's `User.id` — no cross-database foreign key.

## Data

- `Workspace { id, name, slug, … }`
- `WorkspaceMember { workspaceId, userId, role }` — `@@unique([workspaceId, userId])`; roles `OWNER ADMIN AGENT VIEWER`
- `WorkspaceInvitation { workspaceId, invitedUserId, invitedBy, role, status (PENDING/ACCEPTED/DECLINED/REVOKED), expiresAt }`
- `WorkspaceAuditLog { workspaceId, actorUserId, action, targetUserId?, metadata? }`

Creation is transactional: Workspace + OWNER membership commit together or roll back.

## Rules

Rename/delete workspace, change/remove members, invite/revoke → `OWNER` (or `ADMIN`
except owner-only acts). Only `OWNER` may grant `OWNER`, touch the owner, or delete.
Owner cannot leave or demote self. Invitations expire; only the invited user can accept.

## Endpoints (all under `/api`)

Workspaces: `POST /workspaces` · `GET /workspaces` · `GET|PATCH|DELETE /workspaces/:workspaceId` ·
members `GET /:id/members`, `GET|PATCH(role)|DELETE /:id/members/:userId`, `POST /:id/leave` ·
invitations `POST|GET /:id/invitations`, `DELETE /:id/invitations/:invitationId`,
`POST /invitations/:invitationId/accept|decline` ·
internal `GET /internal/workspaces/:workspaceId`,
`GET /internal/workspaces/:workspaceId/members/:userId`,
`GET /internal/workspaces/:workspaceId/permissions/:userId`.

## Auth model

Resolves caller as `req.auth.user.id ?? x-user-id` header. The gateway injects
`x-user-id` after validating the Identity session cookie, so browser clients just
send cookies. Direct callers pass `x-user-id` (dev only — enforce the internal
token before production).

Workspace validates users via `IDENTITY_SERVICE_URL/internal/users/:userId`.

## Env names

`DATABASE_URL` (…/workplace), `IDENTITY_SERVICE_URL=http://localhost:8000`,
`INTERNAL_API_TOKEN`, (`PORT` in `.env` is unused — port is hardcoded 7999).
