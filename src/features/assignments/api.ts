import { supabase } from '@/shared/lib/supabase';
import type { InsertTables } from '@/shared/types/database';
import type { ActiveMember, ProjectMemberWithAssignments } from './types';

interface CreateProjectMemberInput {
  projectId: string;
  memberId: string | null;
  name: string;
  role: string;
  note: string | null;
  skillIds: string[];
  startMonth: string;
  endMonth: string | null;
  percentage: number | null;
}

interface UpdateProjectMemberProfileInput {
  projectMemberId: string;
  name: string | null;
  role: string | null;
  note: string | null;
  skillIds: string[];
}

export async function fetchProjectMembersByProject(
  projectId: string,
): Promise<ProjectMemberWithAssignments[]> {
  const { data, error } = await supabase
    .from('project_members')
    .select(
      '*, members(id, name, category, role), project_member_skills(skill_id, skills(id, name)), assignments(*)',
    )
    .eq('project_id', projectId)
    .order('name')
    .order('month', { foreignTable: 'assignments', ascending: true });

  if (error) throw error;
  return data as unknown as ProjectMemberWithAssignments[];
}

export async function fetchActiveMembers(): Promise<ActiveMember[]> {
  const { data, error } = await supabase
    .from('members')
    .select('id, name, role, category, member_skills(skill_id, skills(id, name))')
    .eq('is_active', true)
    .eq('is_placeholder', false)
    .neq('category', '未定枠')
    .order('name');

  if (error) throw error;
  return data as unknown as ActiveMember[];
}

export async function createProjectMember(
  input: CreateProjectMemberInput,
): Promise<{ id: string }> {
  const { data, error } = await supabase.rpc('create_project_member_with_assignments', {
    p_project_id: input.projectId,
    p_member_id: input.memberId,
    p_name: input.name,
    p_role: input.role,
    p_note: input.note,
    p_skill_ids: input.skillIds,
    p_start: input.startMonth,
    p_end: input.endMonth,
    p_percentage: input.percentage,
  });

  if (error) throw error;
  return { id: data as string };
}

export async function updateProjectMemberProfile(
  input: UpdateProjectMemberProfileInput,
): Promise<void> {
  const { error } = await supabase.rpc('update_project_member_profile', {
    p_project_member_id: input.projectMemberId,
    p_name: input.name,
    p_role: input.role,
    p_note: input.note,
    p_skill_ids: input.skillIds,
  });

  if (error) throw error;
}

export async function confirmProjectMember(
  projectMemberId: string,
  memberId: string,
): Promise<void> {
  const { error } = await supabase.rpc('confirm_project_member_assignment', {
    p_project_member_id: projectMemberId,
    p_member_id: memberId,
  });

  if (error) throw error;
}

export async function upsertAssignmentsForRange(input: {
  projectMemberId: string;
  startMonth: string;
  endMonth: string | null;
  percentage: number | null;
}): Promise<void> {
  const { error } = await supabase.rpc('upsert_project_member_assignments_for_range', {
    p_project_member_id: input.projectMemberId,
    p_start: input.startMonth,
    p_end: input.endMonth,
    p_percentage: input.percentage,
    p_note: null,
  });

  if (error) throw error;
}

export async function upsertAssignment(data: InsertTables<'assignments'>): Promise<void> {
  const { error } = await supabase
    .from('assignments')
    .upsert(data, { onConflict: 'project_member_id,month' });

  if (error) throw error;
}

export async function deleteProjectMember(projectMemberId: string): Promise<void> {
  const { error } = await supabase.from('project_members').delete().eq('id', projectMemberId);

  if (error) throw error;
}
