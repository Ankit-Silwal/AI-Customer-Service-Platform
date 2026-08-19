import prisma from "../config/prisma.js";

export async function createWorkSpaceWithOwner(
  name:string,
  slug:string,
  userId:string
){
  return prisma.$transaction(async(tx)=>{
    const workspace=await tx.workspace.create({
      data:{
        name,
        slug
      }
    });
    await tx.workspaceMember.create({
      data:{
        workspaceId:workspace.id,
        userId,
        role:"OWNER"
      }
    })
    return workspace
  })
}