# Identity Service

The identity service is the authentication and session layer for the platform.

## Responsibilities

- user registration
- OTP email verification
- login and logout
- session tracking and deletion
- internal user existence checks for trusted services

## Base URL

```text
http://localhost:8000/api
```

## Routes

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/verify-otp` | Verify registration code |
| POST | `/api/auth/login` | Sign in a user |
| GET | `/api/auth/me` | Return current authenticated user |
| POST | `/api/auth/logout` | Log out the current user |
| GET | `/api/sessions/:userId` | List sessions for a user |
| DELETE | `/api/sessions/:userId` | Delete all sessions for a user |
| DELETE | `/api/sessions/:userId/all` | Delete all sessions for a user |
| DELETE | `/api/sessions/:userId/:sessionId` | Delete one session |
| GET | `/internal/users/:userId` | Trusted internal user lookup |

## Example

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "StrongPassword123!",
  "conformPassword": "StrongPassword123!"
}
```

## Stack

- Express
- PostgreSQL
- Redis
- Prisma
- Nodemailer

## Run

```bash
cd apps/identity_service
npm run dev
```
