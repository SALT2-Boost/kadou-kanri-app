import { supabase } from '@/shared/lib/supabase';
import type { InsertTables, UpdateTables } from '@/shared/types/database';
import type { MemberScheduleAssignment, MemberWithSkills, Skill } from './types';

export async function fetchMembers(): Promise<MemberWithSkills[]> {
  const { data, error } = await supabase
    .from('members')
    .select('*, member_skills(skill_id, skills(id, name))')
    .eq('is_active', true)
    .eq('is_placeholder', false)
    .neq('category', '未定枠')
    .order('name');

  if (error) throw error;
  return data as unknown as MemberWithSkills[];
}

export async function fetchMember(id: string): Promise<MemberWithSkills> {
  const { data, error } = await supabase
    .from('members')
    .select('*, member_skills(skill_id, skills(id, name))')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as unknown as MemberWithSkills;
}

export async function createMember(input: InsertTables<'members'>): Promise<MemberWithSkills> {
  const { data, error } = await supabase
    .from('members')
    .insert(input)
    .select('*, member_skills(skill_id, skills(id, name))')
    .single();

  if (error) throw error;
  return data as unknown as MemberWithSkills;
}

export async function updateMember(
  id: string,
  input: UpdateTables<'members'>,
): Promise<MemberWithSkills> {
  const { data, error } = await supabase
    .from('members')
    .update(input)
    .eq('id', id)
    .select('*, member_skills(skill_id, skills(id, name))')
    .single();

  if (error) throw error;
  return data as unknown as MemberWithSkills;
}

export async function deleteMember(id: string): Promise<void> {
  const { error } = await supabase.from('members').update({ is_active: false }).eq('id', id);

  if (error) throw error;
}

export async function fetchSkills(): Promise<Skill[]> {
  const { data, error } = await supabase.from('skills').select('*').order('name');

  if (error) throw error;
  return data as Skill[];
}

export async function updateMemberSkills(memberId: string, skillIds: string[]): Promise<void> {
  // 既存のスキル紐付けを削除
  const { error: deleteError } = await supabase
    .from('member_skills')
    .delete()
    .eq('member_id', memberId);

  if (deleteError) throw deleteError;

  // 新しいスキル紐付けを一括挿入
  if (skillIds.length > 0) {
    const rows = skillIds.map((skill_id) => ({
      member_id: memberId,
      skill_id,
    }));

    const { error: insertError } = await supabase.from('member_skills').insert(rows);

    if (insertError) throw insertError;
  }
}

export async function fetchMemberUpcomingAssignments(
  memberId: string,
  startMonth: string,
  endMonth: string,
): Promise<MemberScheduleAssignment[]> {
  const { data, error } = await supabase
    .from('assignments')
    .select('project_id, month, percentage, projects(id, name)')
    .eq('member_id', memberId)
    .gte('month', startMonth)
    .lte('month', endMonth)
    .order('month')
    .order('project_id');

  if (error) throw error;
  return (data ?? []) as MemberScheduleAssignment[];
}
