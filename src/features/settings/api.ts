import { supabase } from '@/shared/lib/supabase';
import type { InsertTables, UpdateTables } from '@/shared/types/database';
import type { ProjectCategoryMaster, SkillMaster } from './types';

export async function fetchSkillsMaster(): Promise<SkillMaster[]> {
  const { data, error } = await supabase.from('skills').select('*').order('name');

  if (error) throw error;
  return data as SkillMaster[];
}

export async function createSkillMaster(input: InsertTables<'skills'>): Promise<SkillMaster> {
  const { data, error } = await supabase.from('skills').insert(input).select().single();

  if (error) throw error;
  return data as SkillMaster;
}

export async function updateSkillMaster(id: string, name: string): Promise<SkillMaster> {
  const { data, error } = await supabase
    .from('skills')
    .update({ name } satisfies UpdateTables<'skills'>)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as SkillMaster;
}

export async function deleteSkillMaster(id: string): Promise<void> {
  const { error } = await supabase.from('skills').delete().eq('id', id);

  if (error) throw error;
}

export async function fetchProjectCategories(): Promise<ProjectCategoryMaster[]> {
  const { data, error } = await supabase
    .from('project_categories')
    .select('*')
    .order('created_at')
    .order('name');

  if (error) throw error;
  return data as ProjectCategoryMaster[];
}

export async function createProjectCategoryMaster(
  input: InsertTables<'project_categories'>,
): Promise<ProjectCategoryMaster> {
  const { data, error } = await supabase.from('project_categories').insert(input).select().single();

  if (error) throw error;
  return data as ProjectCategoryMaster;
}

export async function updateProjectCategoryMaster(
  currentName: string,
  nextName: string,
): Promise<ProjectCategoryMaster> {
  const { data, error } = await supabase
    .from('project_categories')
    .update({ name: nextName } satisfies UpdateTables<'project_categories'>)
    .eq('name', currentName)
    .select()
    .single();

  if (error) throw error;
  return data as ProjectCategoryMaster;
}

export async function deleteProjectCategoryMaster(name: string): Promise<void> {
  const { error } = await supabase.from('project_categories').delete().eq('name', name);

  if (error) throw error;
}
