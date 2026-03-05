import { supabase } from '@/shared/lib/supabase';
import type { InsertTables } from '@/shared/types/database';
import type { AssignmentWithMember, AssignmentWithProject } from './types';

export async function fetchAssignmentsByProject(
  projectId: string
): Promise<AssignmentWithMember[]> {
  const { data, error } = await supabase
    .from('assignments')
    .select('*, members(id, name)')
    .eq('project_id', projectId)
    .order('month');

  if (error) throw error;
  return data as unknown as AssignmentWithMember[];
}

export async function fetchAssignmentsByMember(
  memberId: string
): Promise<AssignmentWithProject[]> {
  const { data, error } = await supabase
    .from('assignments')
    .select('*, projects(id, name)')
    .eq('member_id', memberId)
    .order('month');

  if (error) throw error;
  return data as unknown as AssignmentWithProject[];
}

export async function upsertAssignment(
  data: InsertTables<'assignments'>
): Promise<AssignmentWithMember> {
  const { data: result, error } = await supabase
    .from('assignments')
    .upsert(data, { onConflict: 'member_id,project_id,month' })
    .select('*, members(id, name)')
    .single();

  if (error) throw error;
  return result as unknown as AssignmentWithMember;
}

export async function deleteAssignment(id: string): Promise<void> {
  const { error } = await supabase.from('assignments').delete().eq('id', id);

  if (error) throw error;
}

export async function deleteAssignmentsByMemberAndProject(
  memberId: string,
  projectId: string
): Promise<void> {
  const { error } = await supabase
    .from('assignments')
    .delete()
    .eq('member_id', memberId)
    .eq('project_id', projectId);

  if (error) throw error;
}
