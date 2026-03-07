interface ProjectMemberStatusLike {
  member_id: string | null;
  members?: {
    category?: string | null;
  } | null;
}

export function isUnconfirmedProjectMember(projectMember: ProjectMemberStatusLike): boolean {
  return projectMember.member_id === null || projectMember.members?.category === '未定枠';
}
