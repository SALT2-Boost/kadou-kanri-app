import { supabase } from '@/shared/lib/supabase';
import type { InsertTables, UpdateTables } from '@/shared/types/database';
import type { Project } from './types';

export interface ProjectPlaceholderInput {
  name: string;
  role: string;
  note: string | null;
  skillIds: string[];
}

interface CreateProjectPlaceholdersInput {
  projectId: string;
  startMonth: string;
  endMonth: string | null;
  placeholders: ProjectPlaceholderInput[];
}

function normalizeProject(project: Project): Project {
  return {
    ...project,
    staffing_targets: project.staffing_targets ?? [],
  };
}

export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as Project[]).map(normalizeProject);
}

export async function fetchProject(id: string): Promise<Project> {
  const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();

  if (error) throw error;
  return normalizeProject(data as Project);
}

export async function createProject(project: InsertTables<'projects'>): Promise<Project> {
  const { data, error } = await supabase.from('projects').insert(project).select().single();

  if (error) throw error;
  return normalizeProject(data as Project);
}

export async function updateProject(
  id: string,
  project: UpdateTables<'projects'>,
): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .update(project)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return normalizeProject(data as Project);
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id);

  if (error) throw error;
}

export async function createProjectPlaceholders(
  input: CreateProjectPlaceholdersInput,
): Promise<void> {
  if (input.placeholders.length === 0) return;

  const results = await Promise.all(
    input.placeholders.map((placeholder) =>
      supabase.rpc('create_project_member_with_assignments', {
        p_project_id: input.projectId,
        p_member_id: null,
        p_name: placeholder.name,
        p_role: placeholder.role,
        p_note: placeholder.note,
        p_skill_ids: placeholder.skillIds,
        p_start: input.startMonth,
        p_end: input.endMonth,
        p_percentage: 100,
      }),
    ),
  );

  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;
}
