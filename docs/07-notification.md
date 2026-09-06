# 07 · Notification Service — “Who needs to know?”

`apps/notification_service` · Express + Nodemailer · **port 3006**

Central mail fan-out so services never send email directly.
`POST /notifications {type: invitation|ticket|assignment|system, to, subject, text}`
→ `202 {queued, delivered}`.

With Gmail SMTP configured it delivers; without it, it dev-logs and returns
`delivered:false` — the platform stays runnable either way. (BullMQ worker is
the later optimization; the endpoint is synchronous for now.)

## Env names

`REDIS_URL`, `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USER`,
`SMTP_PASS` (Gmail app password), `SMTP_FROM`, `INTERNAL_API_TOKEN`, `PORT=3006`.
