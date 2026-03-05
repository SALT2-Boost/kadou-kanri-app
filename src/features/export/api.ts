import { supabase } from '@/shared/lib/supabase';

export interface ExportMember {
  id: string;
  name: string;
  category: string;
  note: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ExportProject {
  id: string;
  name: string;
  monthly_revenue: number | null;
  start_month: string;
  end_month: string | null;
  status: string;
  description: string | null;
  note: string | null;
  created_at: string;
}

export interface ExportAssignment {
  id: string;
  member_id: string;
  project_id: string;
  month: string;
  percentage: number | null;
  note: string | null;
  members: { name: string };
  projects: { name: string };
}

export interface ExportSkill {
  id: string;
  name: string;
}

export async function fetchAllMembers(): Promise<ExportMember[]> {
  const { data, error } = await supabase
    .from('members')
    .select('id, name, category, note, is_active, created_at')
    .order('name');
  if (error) throw error;
  return data as ExportMember[];
}

export async function fetchAllProjects(): Promise<ExportProject[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, monthly_revenue, start_month, end_month, status, description, note, created_at')
    .order('name');
  if (error) throw error;
  return data as ExportProject[];
}

export async function fetchAllAssignments(): Promise<ExportAssignment[]> {
  const { data, error } = await supabase
    .from('assignments')
    .select('id, member_id, project_id, month, percentage, note, members(name), projects(name)')
    .order('month');
  if (error) throw error;
  return data as ExportAssignment[];
}

export async function fetchAllSkills(): Promise<ExportSkill[]> {
  const { data, error } = await supabase
    .from('skills')
    .select('id, name')
    .order('name');
  if (error) throw error;
  return data as ExportSkill[];
}
