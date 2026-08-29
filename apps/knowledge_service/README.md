# Knowledge Service

The knowledge service stores and tracks knowledge sources and uploaded documents that can be used by AI workflows.

## Responsibilities

- create and manage knowledge sources
- track document records for each source
- store metadata such as filename, type, and status
- support future document ingestion and retrieval workflows

## Base URL

```text
http://localhost:<PORT>/knowledge
```

## Routes

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/knowledge/sources` | Create a new knowledge source |

## Example

```http
POST /knowledge/sources
Content-Type: application/json

{
  "workspaceId": "workspace-123",
  "name": "Customer Support FAQs",
  "type": "FAQ"
}
```

## Stack

- Express
- PostgreSQL
- Prisma
- TypeScript

## Run

```bash
cd apps/knowledge_service
npm run dev
```

> The service reads its port from `PORT` in the environment, so set it before starting if needed.
