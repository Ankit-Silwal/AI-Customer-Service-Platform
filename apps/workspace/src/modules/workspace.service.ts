import { verifyUserExists } from "../config/identity.js";
import { createWorkSpaceWithOwner } from "./workspace.repository.js";
import type { createWorkSpaceInput } from "./workspace.types.js";

function createSlug(name:string){
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}


export async function createWorkspace(
  data: createWorkSpaceInput,
  userId: string,
) {
  if (!data.name?.trim()) {
    throw new Error("Workspace name is required");
  }

  const userExists = await verifyUserExists(userId);

  if (!userExists) {
    throw new Error("User does not exist");
  }

  const slug = createSlug(data.name);

  if (!slug) {
    throw new Error("Invalid workspace name");
  }

  return createWorkSpaceWithOwner(data.name.trim(), slug, userId)
}