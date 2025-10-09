export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      group: {
        Row: {
          id: number
          title: string
        }
        Insert: {
          id?: number
          title: string
        }
        Update: {
          id?: number
          title?: string
        }
        Relationships: []
      }
      group_member: {
        Row: {
          group_id: number
          user_id: number
        }
        Insert: {
          group_id: number
          user_id: number
        }
        Update: {
          group_id?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "group_member_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "group"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_member_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      invite: {
        Row: {
          accepted: boolean
          created_at: number
          email: string
          group_id: number
          id: number
          token: string
        }
        Insert: {
          accepted?: boolean
          created_at: number
          email: string
          group_id: number
          id?: number
          token: string
        }
        Update: {
          accepted?: boolean
          created_at?: number
          email?: string
          group_id?: number
          id?: number
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invite_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "group"
            referencedColumns: ["id"]
          },
        ]
      }
      session: {
        Row: {
          expires_at: number
          id: string
          user_id: number
        }
        Insert: {
          expires_at: number
          id: string
          user_id: number
        }
        Update: {
          expires_at?: number
          id?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "session_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      task: {
        Row: {
          assigned_user_id: number | null
          completed_at: number | null
          duration_minutes: number | null
          emoji: string | null
          group_id: number
          id: number
          recurrence_interval: number | null
          recurrence_type: string | null
          scheduled_at: number | null
          title: string
        }
        Insert: {
          assigned_user_id?: number | null
          completed_at?: number | null
          duration_minutes?: number | null
          emoji?: string | null
          group_id: number
          id?: number
          recurrence_interval?: number | null
          recurrence_type?: string | null
          scheduled_at?: number | null
          title: string
        }
        Update: {
          assigned_user_id?: number | null
          completed_at?: number | null
          duration_minutes?: number | null
          emoji?: string | null
          group_id?: number
          id?: number
          recurrence_interval?: number | null
          recurrence_type?: string | null
          scheduled_at?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "group"
            referencedColumns: ["id"]
          },
        ]
      }
      treat: {
        Row: {
          accepted: boolean
          accepted_at: number | null
          accepted_notified_at: number | null
          created_at: number
          declined_at: number | null
          emoji: string | null
          feedback_note: string | null
          from_user_id: number
          group_id: number
          id: number
          title: string
          to_user_id: number
          value_minutes: number
        }
        Insert: {
          accepted?: boolean
          accepted_at?: number | null
          accepted_notified_at?: number | null
          created_at: number
          declined_at?: number | null
          emoji?: string | null
          feedback_note?: string | null
          from_user_id: number
          group_id: number
          id?: number
          title: string
          to_user_id: number
          value_minutes?: number
        }
        Update: {
          accepted?: boolean
          accepted_at?: number | null
          accepted_notified_at?: number | null
          created_at?: number
          declined_at?: number | null
          emoji?: string | null
          feedback_note?: string | null
          from_user_id?: number
          group_id?: number
          id?: number
          title?: string
          to_user_id?: number
          value_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "treat_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treat_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "group"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treat_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      user: {
        Row: {
          available_time_minutes_per_week: number
          email: string
          id: number
          name: string
          password_hash: string | null
        }
        Insert: {
          available_time_minutes_per_week?: number
          email: string
          id?: number
          name: string
          password_hash?: string | null
        }
        Update: {
          available_time_minutes_per_week?: number
          email?: string
          id?: number
          name?: string
          password_hash?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
