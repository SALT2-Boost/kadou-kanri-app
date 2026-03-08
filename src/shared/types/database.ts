type ProjectStaffingTarget = {
  role: string;
  percentage: number;
};

type ProjectCategory =
  | '戦コン'
  | 'AIエージェント'
  | 'システムリプレイス'
  | 'データサイエンス'
  | 'その他';
type ProjectStatus = '確定' | '提案済' | '提案予定';
type MemberCategory = '社員' | '入社予定' | 'インターン' | '未定枠';
type MemberCompany = 'SALT2' | 'ブーストコンサルティング';

export interface Database {
  public: {
    Tables: {
      skills: {
        Row: {
          id: string;
          name: string;
        };
        Insert: {
          id?: string;
          name: string;
        };
        Update: {
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      project_categories: {
        Row: {
          name: string;
          created_at: string;
        };
        Insert: {
          name: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      role_candidates: {
        Row: {
          name: string;
          created_at: string;
        };
        Insert: {
          name: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      members: {
        Row: {
          id: string;
          name: string;
          category: MemberCategory;
          company: MemberCompany;
          note: string | null;
          join_date: string | null;
          is_active: boolean;
          is_placeholder: boolean;
          placeholder_project_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: MemberCategory;
          company?: MemberCompany;
          note?: string | null;
          join_date?: string | null;
          is_active?: boolean;
          is_placeholder?: boolean;
          placeholder_project_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: MemberCategory;
          company?: MemberCompany;
          note?: string | null;
          join_date?: string | null;
          is_active?: boolean;
          is_placeholder?: boolean;
          placeholder_project_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'members_placeholder_project_id_fkey';
            columns: ['placeholder_project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      member_skills: {
        Row: {
          id: string;
          member_id: string;
          skill_id: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          skill_id: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          skill_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'member_skills_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'member_skills_skill_id_fkey';
            columns: ['skill_id'];
            isOneToOne: false;
            referencedRelation: 'skills';
            referencedColumns: ['id'];
          },
        ];
      };
      projects: {
        Row: {
          id: string;
          name: string;
          monthly_revenue: number | null;
          start_month: string;
          end_month: string | null;
          status: ProjectStatus;
          category: ProjectCategory;
          staffing_targets: ProjectStaffingTarget[];
          description: string | null;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          monthly_revenue?: number | null;
          start_month: string;
          end_month?: string | null;
          status?: ProjectStatus;
          category?: ProjectCategory;
          staffing_targets?: ProjectStaffingTarget[];
          description?: string | null;
          note?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          monthly_revenue?: number | null;
          start_month?: string;
          end_month?: string | null;
          status?: ProjectStatus;
          category?: ProjectCategory;
          staffing_targets?: ProjectStaffingTarget[];
          description?: string | null;
          note?: string | null;
        };
        Relationships: [];
      };
      project_members: {
        Row: {
          id: string;
          project_id: string;
          member_id: string | null;
          name: string;
          role: string;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          member_id?: string | null;
          name: string;
          role?: string;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          member_id?: string | null;
          name?: string;
          role?: string;
          note?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'project_members_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'project_members_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      project_member_skills: {
        Row: {
          id: string;
          project_member_id: string;
          skill_id: string;
        };
        Insert: {
          id?: string;
          project_member_id: string;
          skill_id: string;
        };
        Update: {
          id?: string;
          project_member_id?: string;
          skill_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'project_member_skills_project_member_id_fkey';
            columns: ['project_member_id'];
            isOneToOne: false;
            referencedRelation: 'project_members';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'project_member_skills_skill_id_fkey';
            columns: ['skill_id'];
            isOneToOne: false;
            referencedRelation: 'skills';
            referencedColumns: ['id'];
          },
        ];
      };
      assignments: {
        Row: {
          id: string;
          project_member_id: string;
          member_id: string | null;
          project_id: string;
          month: string;
          percentage: number | null;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_member_id: string;
          member_id?: string | null;
          project_id?: string;
          month: string;
          percentage?: number | null;
          note?: string | null;
        };
        Update: {
          id?: string;
          project_member_id?: string;
          member_id?: string | null;
          project_id?: string;
          month?: string;
          percentage?: number | null;
          note?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'assignments_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'assignments_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'assignments_project_member_id_fkey';
            columns: ['project_member_id'];
            isOneToOne: false;
            referencedRelation: 'project_members';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_period_view: {
        Args: { p_start: string; p_end: string };
        Returns: {
          members: Array<{
            id: string;
            name: string;
            category: string;
            skills: string[];
          }>;
          cells: Array<{
            member_id: string;
            month: string;
            total: number;
          }>;
          skills: string[];
        };
      };
      get_period_totals: {
        Args: { p_start: string; p_end: string };
        Returns: Array<{
          member_id: string;
          month: string;
          total: number;
        }>;
      };
      get_members_with_skills: {
        Args: Record<string, never>;
        Returns: Array<{
          id: string;
          name: string;
          category: string;
          skills: Array<{ skill_id: string; name: string }>;
        }>;
      };
      get_assignments_in_month: {
        Args: { p_month: string };
        Returns: Array<{
          member_id: string;
          project_id: string;
          percentage: number | null;
          project_name: string;
        }>;
      };
      upsert_project_member_assignments_for_range: {
        Args: {
          p_project_member_id: string;
          p_start: string;
          p_end: string | null;
          p_percentage?: number | null;
          p_note?: string | null;
        };
        Returns: undefined;
      };
      create_project_member_with_assignments: {
        Args: {
          p_project_id: string;
          p_member_id: string | null;
          p_name: string;
          p_role: string;
          p_note: string | null;
          p_skill_ids: string[] | null;
          p_start: string;
          p_end: string | null;
          p_percentage?: number | null;
        };
        Returns: string;
      };
      update_project_member_profile: {
        Args: {
          p_project_member_id: string;
          p_name: string | null;
          p_role: string | null;
          p_note: string | null;
          p_skill_ids: string[] | null;
        };
        Returns: undefined;
      };
      confirm_project_member_assignment: {
        Args: {
          p_project_member_id: string;
          p_member_id: string;
        };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
