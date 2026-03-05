import type { Tables } from '@/shared/types/database';

export type Assignment = Tables<'assignments'>;

export interface AssignmentWithMember extends Assignment {
  members: { id: string; name: string };
}

export interface AssignmentWithProject extends Assignment {
  projects: { id: string; name: string };
}
