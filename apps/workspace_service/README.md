# Workspace Service

The workspace service manages workspaces, members, invitations, roles, permissions, and workspace activity for the AI customer service platform.

## Purpose

This service owns the workspace domain and is responsible for:
- creating and updating workspaces
- assigning member roles and permissions
- issuing and revoking invitations
- tracking audit events for workspace actions
- exposing internal lookup endpoints for trusted service-to-service calls

## Base URL

```text
http://localhost:7999/api
```

The app mounts the router on `/api` and exposes the health endpoint at `/api/health`.

---

## Authentication

The workspace service resolves the current user in this order:
1. `req.auth.user.id`
2. `x-user-id` request header

If no user identity is present, protected routes return a `401` response.

Internal endpoints are intended for trusted internal calls and should be restricted at the network or gateway layer before production deployment.

---

## Endpoint Summary

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Service health check |
| POST | `/api/workspaces` | Create a workspace |
| GET | `/api/workspaces` | List workspaces for the current user |
| GET | `/api/workspaces/:workspaceId` | Get workspace details |
| PATCH | `/api/workspaces/:workspaceId` | Rename workspace |
| DELETE | `/api/workspaces/:workspaceId` | Delete workspace |
| GET | `/api/workspaces/:workspaceId/members` | List members |
| GET | `/api/workspaces/:workspaceId/members/:userId` | Get a member |
| PATCH | `/api/workspaces/:workspaceId/members/:userId/role` | Update member role |
| DELETE | `/api/workspaces/:workspaceId/members/:userId` | Remove a member |
| POST | `/api/workspaces/:workspaceId/leave` | Leave a workspace |
| POST | `/api/workspaces/:workspaceId/invitations` | Invite an existing user |
| GET | `/api/workspaces/:workspaceId/invitations` | List invitations |
| DELETE | `/api/workspaces/:workspaceId/invitations/:invitationId` | Revoke an invitation |
| POST | `/api/invitations/:invitationId/accept` | Accept an invitation |
| POST | `/api/invitations/:invitationId/decline` | Decline an invitation |
| GET | `/api/internal/workspaces/:workspaceId` | Internal workspace lookup |
| GET | `/api/internal/workspaces/:workspaceId/members/:userId` | Internal member lookup |
| GET | `/api/internal/workspaces/:workspaceId/permissions/:userId` | Permission lookup |

---

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
| Change or remove the owner | `OWNER` only |
| Leave workspace | Any non-owner member |

The service prevents the owner from downgrading their own role and prevents the owner from leaving without transferring ownership first.

---

## Example Requests

### Create workspace

```http
POST /api/workspaces
x-user-id: user-123
Content-Type: application/json

{
  "name": "Support Operations"
}
```

### Update role

```http
PATCH /api/workspaces/workspace-123/members/user-456/role
x-user-id: user-123
Content-Type: application/json

{
  "role": "ADMIN"
}
```

Valid roles are `OWNER`, `ADMIN`, `AGENT`, and `VIEWER`.

### Create invitation

```http
POST /api/workspaces/workspace-123/invitations
x-user-id: user-123
Content-Type: application/json

{
  "userId": "user-456",
  "role": "AGENT"
}
```

---

## Dependencies

- Identity Service: used to confirm the invited or requesting user exists
- PostgreSQL: stores workspaces, members, invitations, and audit logs
- Prisma: manages schema, migrations, and generated client types

---

## Development Notes

- Run using `npm run dev` from this directory.
- The service listens on port `7999` by default.
- If you change Prisma models, regenerate the client with Prisma in this app directory.
- The app uses the `x-user-id` header for local development compatibility alongside `req.auth`.

---

## Identity Service Dependency

The workspace service calls:

```text
${IDENTITY_SERVICE_URL}/internal/users/:userId
```

This is used when creating a workspace and inviting a member. A non-success response is treated as a user-not-found condition.

Set `IDENTITY_SERVICE_URL` in the workspace service environment before running it.

---

## Database and Prisma

The service has a Prisma schema in `prisma/schema.prisma` and generated client output under the app-specific generated folder.

To regenerate the Prisma client:

```bash
cd apps/workspace_service
npx prisma generate
```

To apply migrations:

```bash
cd apps/workspace_service
npx prisma migrate deploy
```

---

## Current Limitations

- Internal routes have no application-level authentication and should be protected at the network or gateway layer before production use.
- Request bodies are not yet validated with Zod at the controller boundary.
- Audit logs do not yet cover every domain action.
