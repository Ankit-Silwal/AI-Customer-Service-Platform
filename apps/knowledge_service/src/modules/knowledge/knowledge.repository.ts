import prisma from "../../config/prisma.js";
import { KnowledgeSourceType } from "../../../generated/prisma/enums.js";

export async function createKnowledgeSource(data:{
  workspaceId:string;
  name:string;
  type:KnowledgeSourceType
}){
  return prisma.KnowledgeSource.create({
    data
  })
}
