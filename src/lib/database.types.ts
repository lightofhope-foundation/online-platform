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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
        }
        Relationships: []
      }
      chapters: {
        Row: {
          board_slug: string | null
          course_id: string
          created_at: string
          deleted_at: string | null
          id: string
          is_intro: boolean
          position: number
          title: string
          updated_at: string
        }
        Insert: {
          board_slug?: string | null
          course_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_intro?: boolean
          position?: number
          title: string
          updated_at?: string
        }
        Update: {
          board_slug?: string | null
          course_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_intro?: boolean
          position?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      client_primary_topics: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          source: string
          topic_slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          source?: string
          topic_slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          source?: string
          topic_slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_primary_topics_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "client_primary_topics_topic_slug_fkey"
            columns: ["topic_slug"]
            isOneToOne: false
            referencedRelation: "loh_topics"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "client_primary_topics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      clients: {
        Row: {
          access_revoked: boolean
          created_at: string
          deleted_at: string | null
          is_paid: boolean
          therapist_user_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_revoked?: boolean
          created_at?: string
          deleted_at?: string | null
          is_paid?: boolean
          therapist_user_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_revoked?: boolean
          created_at?: string
          deleted_at?: string | null
          is_paid?: boolean
          therapist_user_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          published: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          published?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          published?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_unlock_defaults: {
        Row: {
          first_gated_video_position: number
          first_unlock_offset_days: number
          id: string
          subsequent_unlock_interval_days: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          first_gated_video_position?: number
          first_unlock_offset_days?: number
          id?: string
          subsequent_unlock_interval_days?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          first_gated_video_position?: number
          first_unlock_offset_days?: number
          id?: string
          subsequent_unlock_interval_days?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      loh_topic_board_sequences: {
        Row: {
          board_slug: string
          position: number
          topic_slug: string
        }
        Insert: {
          board_slug: string
          position: number
          topic_slug: string
        }
        Update: {
          board_slug?: string
          position?: number
          topic_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "loh_topic_board_sequences_topic_slug_fkey"
            columns: ["topic_slug"]
            isOneToOne: false
            referencedRelation: "loh_topics"
            referencedColumns: ["slug"]
          },
        ]
      }
      loh_topics: {
        Row: {
          created_at: string
          display_name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          display_name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          display_name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      platform_access_levels: {
        Row: {
          access_level: number
          created_at: string
          deleted_at: string | null
          description: string | null
          label: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          access_level: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          label: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          access_level?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          label?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      platform_registration_invite: {
        Row: {
          current_code: string
          id: number
          last_rotated_at: string | null
          rotated_by: string | null
          updated_at: string
        }
        Insert: {
          current_code: string
          id?: number
          last_rotated_at?: string | null
          rotated_by?: string | null
          updated_at?: string
        }
        Update: {
          current_code?: string
          id?: number
          last_rotated_at?: string | null
          rotated_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      platform_unlock_defaults_by_level: {
        Row: {
          access_level: number
          first_gated_video_position: number
          first_unlock_offset_days: number
          subsequent_unlock_interval_days: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          access_level: number
          first_gated_video_position?: number
          first_unlock_offset_days?: number
          subsequent_unlock_interval_days?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          access_level?: number
          first_gated_video_position?: number
          first_unlock_offset_days?: number
          subsequent_unlock_interval_days?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      profile_registration_values: {
        Row: {
          field_id: string
          updated_at: string
          user_id: string
          value: string | null
        }
        Insert: {
          field_id: string
          updated_at?: string
          user_id: string
          value?: string | null
        }
        Update: {
          field_id?: string
          updated_at?: string
          user_id?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_registration_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "registration_field_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_registration_values_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          access_level: number
          can_soft_delete: boolean
          client_id: string | null
          created_at: string
          date_of_birth: string | null
          first_name: string | null
          house_number: string | null
          last_name: string | null
          role: Database["public"]["Enums"]["user_role"]
          street: string | null
          display_alias: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_level?: number
          can_soft_delete?: boolean
          client_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name?: string | null
          house_number?: string | null
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          street?: string | null
          display_alias?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_level?: number
          can_soft_delete?: boolean
          client_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_alias?: string | null
          first_name?: string | null
          house_number?: string | null
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          street?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      registration_field_definitions: {
        Row: {
          created_at: string
          deleted_at: string | null
          field_key: string
          id: string
          is_system: boolean
          label: string
          required: boolean
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          field_key: string
          id?: string
          is_system?: boolean
          label: string
          required?: boolean
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          field_key?: string
          id?: string
          is_system?: boolean
          label?: string
          required?: boolean
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      user_video_unlocks: {
        Row: {
          created_at: string
          global_position: number
          source: Database["public"]["Enums"]["unlock_schedule_source"]
          unlock_at: string
          updated_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          global_position: number
          source?: Database["public"]["Enums"]["unlock_schedule_source"]
          unlock_at: string
          updated_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          global_position?: number
          source?: Database["public"]["Enums"]["unlock_schedule_source"]
          unlock_at?: string
          updated_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_video_unlocks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_video_unlocks_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          deleted_at: string | null
          id: string
          last_second: number
          percent: number
          updated_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          last_second?: number
          percent?: number
          updated_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          last_second?: number
          percent?: number
          updated_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_progress_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          bunny_video_id: string | null
          chapter_id: string
          created_at: string
          deleted_at: string | null
          duration_seconds: number | null
          id: string
          position: number
          requires_workbook: boolean
          title: string
          updated_at: string
        }
        Insert: {
          bunny_video_id?: string | null
          chapter_id: string
          created_at?: string
          deleted_at?: string | null
          duration_seconds?: number | null
          id?: string
          position?: number
          requires_workbook?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          bunny_video_id?: string | null
          chapter_id?: string
          created_at?: string
          deleted_at?: string | null
          duration_seconds?: number | null
          id?: string
          position?: number
          requires_workbook?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      workbook_submissions: {
        Row: {
          answers_json: Json
          created_at: string
          deleted_at: string | null
          id: string
          reviewed_at: string | null
          status: string
          submitted_at: string | null
          updated_at: string
          user_id: string
          workbook_id: string
        }
        Insert: {
          answers_json?: Json
          created_at?: string
          deleted_at?: string | null
          id?: string
          reviewed_at?: string | null
          status: string
          submitted_at?: string | null
          updated_at?: string
          user_id: string
          workbook_id: string
        }
        Update: {
          answers_json?: Json
          created_at?: string
          deleted_at?: string | null
          id?: string
          reviewed_at?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
          workbook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workbook_submissions_workbook_id_fkey"
            columns: ["workbook_id"]
            isOneToOne: false
            referencedRelation: "workbooks"
            referencedColumns: ["id"]
          },
        ]
      }
      workbooks: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          schema_json: Json
          updated_at: string
          video_id: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          schema_json: Json
          updated_at?: string
          video_id?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          schema_json?: Json
          updated_at?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workbooks_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: true
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_reorder_chapters: {
        Args: { p_items: Json }
        Returns: undefined
      }
      admin_reorder_videos: {
        Args: { p_items: Json }
        Returns: undefined
      }
      allocate_next_client_id: {
        Args: { p_first_name: string; p_last_name: string }
        Returns: string
      }
      ensure_registration_invite_row: { Args: Record<string, never>; Returns: string }
      generate_registration_invite_code: { Args: Record<string, never>; Returns: string }
      rotate_registration_invite_code: {
        Args: { p_actor_id?: string | null }
        Returns: string
      }
      ensure_catalog_soft_delete_guards: { Args: never; Returns: undefined }
      get_published_videos_ordered: {
        Args: never
        Returns: {
          global_position: number
          video_id: string
        }[]
      }
      has_soft_delete: { Args: never; Returns: boolean }
      is_admin:
        | { Args: never; Returns: boolean }
        | { Args: { p_uid: string }; Returns: boolean }
      is_therapist: { Args: never; Returns: boolean }
      resolve_unlock_defaults_for_user: {
        Args: { p_user_id: string }
        Returns: {
          first_gated_video_position: number
          first_unlock_offset_days: number
          subsequent_unlock_interval_days: number
        }[]
      }
      seed_all_clients_video_unlocks: { Args: Record<string, never>; Returns: number }
      seed_user_video_unlocks: {
        Args: { p_user_id: string }
        Returns: number
      }
    }
    Enums: {
      unlock_schedule_source: "default" | "manual" | "override"
      user_role: "admin" | "therapist" | "patient" | "client"
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
    Enums: {
      unlock_schedule_source: ["default", "manual", "override"],
      user_role: ["admin", "therapist", "patient", "client"],
    },
  },
} as const


