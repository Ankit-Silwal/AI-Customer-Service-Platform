export type createWorkSpaceInput={
  name:string
}

export type updateWorkspaceInput = { name?: string };
export type createInvitationInput = {
  userId: string;
  role?: "OWNER" | "ADMIN" | "AGENT" | "VIEWER";
};
export type updateMemberRoleInput = {
  role: "OWNER" | "ADMIN" | "AGENT" | "VIEWER";
};