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
      members: {
        Row: {
          id: string;
          name: string;
          category: '社員' | '入社予定' | 'インターン' | '未定枠';
          note: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: '社員' | '入社予定' | 'インターン' | '未定枠';
          note?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: '社員' | '入社予定' | 'インターン' | '未定枠';
          note?: string | null;
          is_active?: boolean;
        };
        Relationships: [];
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
          status: '確定' | '提案済' | '提案';
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
          status?: '確定' | '提案済' | '提案';
          description?: string | null;
          note?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          monthly_revenue?: number | null;
          start_month?: string;
          end_month?: string | null;
          status?: '確定' | '提案済' | '提案';
          description?: string | null;
          note?: string | null;
        };
        Relationships: [];
      };
      assignments: {
        Row: {
          id: string;
          member_id: string;
          project_id: string;
          month: string;
          percentage: number | null;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          project_id: string;
          month: string;
          percentage?: number | null;
          note?: string | null;
        };
        Update: {
          id?: string;
          member_id?: string;
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
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_members_with_skills: {
        Args: Record<string, never>;
        Returns: Array<{
          id: string;
          name: string;
          category: string;
          skills: Array<{ skill_id: string; name: string }>;
        }>;
      };
      get_assignments_in_range: {
        Args: { p_start: string; p_end: string };
        Returns: Array<{
          member_id: string;
          project_id: string;
          month: string;
          percentage: number | null;
          project_name: string;
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
