import type { KnowledgeSourceType } from "../../../generated/prisma/enums.js";


export type CreateKnowledgeSourceInput={
  workspaceId:string,
  name:string,
  type:KnowledgeSourceType
}