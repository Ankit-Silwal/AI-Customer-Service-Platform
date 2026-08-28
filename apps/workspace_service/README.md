# Identity and Workspace Services

## Identity Service

The identity service handles user registration, email verification, login, sessions, logout, and internal user-existence checks used by the workspace service.

### Base URL

The public identity routes are mounted at `/api`:

```text
http://localhost:<IDENTITY_PORT>/api
```

The internal user lookup is mounted directly on the Express application:

```text
http://localhost:<IDENTITY_PORT>/internal/users/:userId
```

### Endpoint Summary

| Method | Path | Purpose | Authentication |
| --- | --- | --- | --- |
| GET | `/api/health` | Check service health. | Public |
| POST | `/api/auth/register` | Create a user and send a registration OTP. | Public |
| POST | `/api/auth/verify-otp` | Verify the registration OTP and email address. | Public |
| POST | `/api/auth/login` | Authenticate a verified user and create a session. | Public |
| GET | `/api/auth/me` | Return the current user and session. | Session cookie |
| POST | `/api/auth/logout` | Delete the current session and clear the cookie. | Session cookie |
| GET | `/api/sessions/:userId` | List sessions for a user. | Session middleware |
| DELETE | `/api/sessions/:userId` | Delete the user’s sessions. | Session middleware |
| DELETE | `/api/sessions/:userId/all` | Delete all sessions for a user. | Session middleware |
| DELETE | `/api/sessions/:userId/:sessionId` | Delete one specific session. | Session middleware |
| GET | `/internal/users/:userId` | Check whether a user exists. | Trusted internal caller |

### Registration

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "strong-password",
  "conformPassword": "strong-password"
}
```

Registration validates the required fields, matching passwords, password strength, and email uniqueness. It creates the user, generates an OTP, and sends the registration email. The user must verify the OTP before login.

```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "userId": "user-123",
  "otp": "123456"
}
```

### Login and Sessions

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "ada@example.com",
  "password": "strong-password"
}
```

Successful login creates a session and sets an HTTP-only `sessionId` cookie. The cookie is configured with `SameSite=Lax` and a one-day maximum age. Authenticated requests use that cookie through the `requireAuth` middleware.

`GET /api/auth/me` returns the authenticated user and session. `POST /api/auth/logout` removes the current session and clears the cookie.

### Internal User Lookup

The workspace service calls the following endpoint before creating a workspace or invitation:

```http
GET /internal/users/user-123
```

Responses:

```json
{ "exists": true }
```

```json
{ "exists": false }
```

The endpoint returns `404` when the user does not exist. It currently has no application-level authentication, so it should be restricted to trusted service-to-service traffic at the network or gateway layer.

### Identity Service Environment

The identity service requires configuration for its PostgreSQL database, Redis session store, and registration email delivery. The workspace service additionally requires `IDENTITY_SERVICE_URL` pointing to the identity service host, for example:

```text
IDENTITY_SERVICE_URL=http://localhost:<IDENTITY_PORT>
```

---

# Workspace Service

The workspace service manages workspaces, members, invitations, roles, permissions, and workspace audit records.

## Base URL

The Express application mounts the root router at `/api`.

```text
http://localhost:<PORT>/api
```

The default service port is `5000`.

## Authentication

Workspace controllers resolve the authenticated user ID in this order:

1. `req.auth.user.id`, when an authentication middleware has populated the request.
2. The `x-user-id` request header, retained for service-to-service and local development compatibility.

Requests without a user ID receive `401 Authentication required` for protected workspace operations.

The internal endpoints currently do not require a user ID. They are intended for trusted service-to-service calls and should be protected at the network or gateway layer before production use.

## Endpoint Summary

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/workspaces` | Create a workspace and add the requester as `OWNER`. |
| GET | `/workspaces` | List workspaces where the requester is a member. |
| GET | `/workspaces/:workspaceId` | Get workspace details for a member. |
| PATCH | `/workspaces/:workspaceId` | Rename a workspace. `OWNER` only. |
| DELETE | `/workspaces/:workspaceId` | Delete a workspace. `OWNER` only. |
| GET | `/workspaces/:workspaceId/members` | List workspace members. |
| GET | `/workspaces/:workspaceId/members/:userId` | Get one workspace member. |
| PATCH | `/workspaces/:workspaceId/members/:userId/role` | Change a member role. `OWNER` or `ADMIN`. |
| DELETE | `/workspaces/:workspaceId/members/:userId` | Remove a member. `OWNER` or `ADMIN`, with owner protections. |
| POST | `/workspaces/:workspaceId/leave` | Leave a workspace. The owner cannot leave. |
| POST | `/workspaces/:workspaceId/invitations` | Invite an existing identity-service user. |
| GET | `/workspaces/:workspaceId/invitations` | List invitations. `OWNER` or `ADMIN`. |
| DELETE | `/workspaces/:workspaceId/invitations/:invitationId` | Revoke an invitation. `OWNER` or `ADMIN`. |
| POST | `/invitations/:invitationId/accept` | Accept an invitation as the invited user. |
| POST | `/invitations/:invitationId/decline` | Decline an invitation as the invited user. |
| GET | `/internal/workspaces/:workspaceId` | Return workspace data for trusted internal callers. |
| GET | `/internal/workspaces/:workspaceId/members/:userId` | Return one member for trusted internal callers. |
| GET | `/internal/workspaces/:workspaceId/permissions/:userId` | Return a member role and derived permissions. |

All paths above are relative to `/api`.

## Request Examples

### Create a workspace

```http
POST /api/workspaces
x-user-id: user-123
Content-Type: application/json

{
  "name": "Support Operations"
}
```

The service trims the name and generates a lowercase URL-safe slug. The requester is created as the workspace `OWNER` in the same database transaction.

### Rename a workspace

```http
PATCH /api/workspaces/workspace-123
x-user-id: user-123
Content-Type: application/json

{
  "name": "Customer Support Operations"
}
```

The current implementation accepts `name`. The slug is regenerated from the new name.

### Change a member role

```http
PATCH /api/workspaces/workspace-123/members/user-456/role
x-user-id: user-123
Content-Type: application/json

{
  "role": "ADMIN"
}
```

Valid roles are `OWNER`, `ADMIN`, `AGENT`, and `VIEWER`.

### Create an invitation

```http
POST /api/workspaces/workspace-123/invitations
x-user-id: user-123
Content-Type: application/json

{
  "userId": "user-456",
  "role": "AGENT"
}
```

Invitations expire seven days after creation. The invited user must already exist in the identity service.

## Authorization Rules

| Operation | Required role |
| --- | --- |
| List or view a workspace | Any member |
| List or view members | Any member |
| Rename workspace | `OWNER` |
| Delete workspace | `OWNER` |
| Change member role | `OWNER` or `ADMIN` |
| Remove a member | `OWNER` or `ADMIN` |
| Create, list, or revoke invitations | `OWNER` or `ADMIN` |
| Grant or invite the `OWNER` role | `OWNER` only |
| Change or remove the owner | `OWNER` only, and the owner cannot be removed |
| Leave workspace | Any non-owner member |

The service prevents an owner from downgrading their own role and prevents the owner from leaving without transferring ownership first.

## Response Behavior

Successful responses return JSON. Common status codes are:

- `200`: successful read or update.
- `201`: workspace or invitation created.
- `400`: validation, membership, authorization, or domain error.
- `401`: no user ID was supplied for a protected operation.

Error responses use this shape:

```json
{
  "message": "Workspace membership required"
}
```

## Data Model

The Prisma schema contains these models:

### `Workspace`

- `id`: UUID primary key.
- `name`: display name.
- `slug`: generated URL-safe name.
- `createdAt`, `updatedAt`: timestamps.
- Relations to members, invitations, and audit logs.

### `WorkspaceMember`

- `workspaceId` and `userId`: unique together.
- `role`: `OWNER`, `ADMIN`, `AGENT`, or `VIEWER`.
- Cascade-deletes with its workspace.

### `WorkspaceInvitation`

- `invitedUserId`: identity-service user receiving the invitation.
- `invitedBy`: user who created the invitation.
- `role`: role granted on acceptance.
- `status`: `PENDING`, `ACCEPTED`, `DECLINED`, or `REVOKED`.
- `expiresAt`: seven days after creation.

### `WorkspaceAuditLog`

- `actorUserId`: user who performed the action.
- `action`: action identifier such as `WORKSPACE_UPDATED`, `MEMBER_REMOVED`, or `INVITATION_CREATED`.
- `targetUserId`: optional affected user.
- `metadata`: optional JSON details.

Audit records are currently written for workspace updates, member role changes, member removal, leaving a workspace, and invitation creation or revocation. Workspace deletion and invitation responses are not currently audited.

## Identity Service Dependency

The workspace service calls:

```text
${IDENTITY_SERVICE_URL}/internal/users/:userId
```

This check is used when creating a workspace and inviting a member. A non-success response is treated as `User does not exist`.

Set `IDENTITY_SERVICE_URL` in the workspace service environment.

## Database Setup

The Prisma schema is located at:

```text
apps/workspace/prisma/schema.prisma
```

The workspace Prisma client is generated into:

```text
apps/workspace/src/generated/prisma
```

Generate the client from `apps/workspace`:

```powershell
npm exec prisma generate
```

The management migration is:

```text
apps/workspace/prisma/migrations/20260820100000_add_workspace_management/migration.sql
```

Apply migrations after PostgreSQL is available and `DATABASE_URL` is configured:

```powershell
npm exec prisma migrate deploy
```

## Development Commands

From `apps/workspace`:

```powershell
npm exec tsc -- --noEmit -p tsconfig.json
npm exec prettier -- --write src/modules/workspace.controller.ts
```

From the repository root, the workspace app can also be included through the Turborepo scripts where the corresponding task is configured.

## Implementation Layout

- `src/modules/workspace.routes.ts`: workspace-scoped route registration.
- `src/modules/workspace.controller.ts`: request parsing, user ID resolution, and JSON responses.
- `src/modules/workspace.service.ts`: validation, authorization, domain behavior, and audit calls.
- `src/modules/workspace.repository.ts`: Prisma queries and transactions.
- `src/modules/workspace.types.ts`: request input types.
- `routes.ts`: root health, invitation response, and internal route registration.
- `prisma/schema.prisma`: database models and enums.

## Current Limitations

- The workspace app does not currently install its own `requireAuth` middleware; it accepts a populated `req.auth` object or the compatibility `x-user-id` header.
- Internal routes have no application-level authentication and must be restricted to trusted callers.
- Request bodies are typed but are not yet validated with Zod at the controller boundary.
- The migration could not be applied automatically when the configured PostgreSQL server at `localhost:5555` was unavailable; the SQL migration is committed for deployment.
- Audit logs do not yet cover workspace deletion or invitation acceptance and decline.
