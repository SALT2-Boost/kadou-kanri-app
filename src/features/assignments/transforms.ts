import type { ProjectMemberRow, ProjectMemberWithAssignments } from './types';
import { isUnconfirmedProjectMember } from '@/shared/lib/projectMembers';

export function buildProjectMemberRows(
  projectMembers: ProjectMemberWithAssignments[],
): ProjectMemberRow[] {
  return [...projectMembers]
    .map((projectMember) => {
      const unconfirmed = isUnconfirmedProjectMember(projectMember);

      return {
        projectMemberId: projectMember.id,
        memberId: unconfirmed ? null : projectMember.member_id,
        memberName: projectMember.name,
        role: projectMember.role,
        isUnconfirmed: unconfirmed,
        skillNames: projectMember.project_member_skills
          .map((link) => link.skills.name)
          .sort((a, b) => a.localeCompare(b, 'ja')),
        note: projectMember.note,
        cells: new Map(
          projectMember.assignments
            .slice()
            .sort((a, b) => a.month.localeCompare(b.month))
            .map((assignment) => [
              assignment.month,
              {
                assignmentId: assignment.id,
                percentage: assignment.percentage,
              },
            ]),
        ),
      };
    })
    .sort((a, b) => {
      if (a.isUnconfirmed !== b.isUnconfirmed) {
        return a.isUnconfirmed ? -1 : 1;
      }
      return a.memberName.localeCompare(b.memberName, 'ja');
    });
}
