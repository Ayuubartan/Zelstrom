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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      agents: {
        Row: {
          agent_name: string
          agent_type: string
          avg_cost: number
          avg_defects: number
          avg_efficiency: number
          avg_yield: number
          created_at: string
          deployments: number
          dominance_rank: number
          fitness_score: number
          id: string
          status: string
          total_runs: number
          updated_at: string
          version: number
        }
        Insert: {
          agent_name: string
          agent_type?: string
          avg_cost?: number
          avg_defects?: number
          avg_efficiency?: number
          avg_yield?: number
          created_at?: string
          deployments?: number
          dominance_rank?: number
          fitness_score?: number
          id?: string
          status?: string
          total_runs?: number
          updated_at?: string
          version?: number
        }
        Update: {
          agent_name?: string
          agent_type?: string
          avg_cost?: number
          avg_defects?: number
          avg_efficiency?: number
          avg_yield?: number
          created_at?: string
          deployments?: number
          dominance_rank?: number
          fitness_score?: number
          id?: string
          status?: string
          total_runs?: number
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      deployments: {
        Row: {
          agent_name: string
          created_at: string
          generation_id: number
          id: string
          result: Json | null
          score: number
          stage_configs: Json
        }
        Insert: {
          agent_name: string
          created_at?: string
          generation_id: number
          id?: string
          result?: Json | null
          score?: number
          stage_configs?: Json
        }
        Update: {
          agent_name?: string
          created_at?: string
          generation_id?: number
          id?: string
          result?: Json | null
          score?: number
          stage_configs?: Json
        }
        Relationships: []
      }
      design_uploads: {
        Row: {
          analysis_result: Json | null
          analysis_status: string | null
          category: string
          created_at: string
          description: string | null
          extracted_data: Json | null
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          mime_type: string | null
          scenario_id: string | null
          tags: string[] | null
          team_id: string | null
          updated_at: string
        }
        Insert: {
          analysis_result?: Json | null
          analysis_status?: string | null
          category?: string
          created_at?: string
          description?: string | null
          extracted_data?: Json | null
          file_name: string
          file_size?: number | null
          file_type?: string
          file_url: string
          id?: string
          mime_type?: string | null
          scenario_id?: string | null
          tags?: string[] | null
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          analysis_result?: Json | null
          analysis_status?: string | null
          category?: string
          created_at?: string
          description?: string | null
          extracted_data?: Json | null
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          mime_type?: string | null
          scenario_id?: string | null
          tags?: string[] | null
          team_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      generations: {
        Row: {
          attacks: Json
          created_at: string
          fitness_score: number
          generation_number: number
          id: number
          improvement: number
          proposals: Json
          retired: Json
          strategy_bias: string
          survivor: Json | null
          timestamp: number
        }
        Insert: {
          attacks?: Json
          created_at?: string
          fitness_score?: number
          generation_number: number
          id?: number
          improvement?: number
          proposals?: Json
          retired?: Json
          strategy_bias?: string
          survivor?: Json | null
          timestamp?: number
        }
        Update: {
          attacks?: Json
          created_at?: string
          fitness_score?: number
          generation_number?: number
          id?: number
          improvement?: number
          proposals?: Json
          retired?: Json
          strategy_bias?: string
          survivor?: Json | null
          timestamp?: number
        }
        Relationships: []
      }
      heal_events: {
        Row: {
          action: string
          anomaly_type: string
          created_at: string
          description: string
          duration_ms: number
          id: string
          resolution: string
          sensor_id: string | null
          sensor_unit: string | null
          sensor_value: number | null
          severity: string
          station_id: string
          station_name: string
          success: boolean
          threshold: number
        }
        Insert: {
          action: string
          anomaly_type: string
          created_at?: string
          description: string
          duration_ms?: number
          id?: string
          resolution: string
          sensor_id?: string | null
          sensor_unit?: string | null
          sensor_value?: number | null
          severity?: string
          station_id: string
          station_name: string
          success?: boolean
          threshold?: number
        }
        Update: {
          action?: string
          anomaly_type?: string
          created_at?: string
          description?: string
          duration_ms?: number
          id?: string
          resolution?: string
          sensor_id?: string | null
          sensor_unit?: string | null
          sensor_value?: number | null
          severity?: string
          station_id?: string
          station_name?: string
          success?: boolean
          threshold?: number
        }
        Relationships: []
      }
      orchestration_plans: {
        Row: {
          created_at: string
          deployed_agent: Json | null
          id: string
          sandbox_results: Json
          scenario_id: string | null
          score: number
          sdmf_generation: Json | null
          status: string
          strategy: string
        }
        Insert: {
          created_at?: string
          deployed_agent?: Json | null
          id?: string
          sandbox_results?: Json
          scenario_id?: string | null
          score?: number
          sdmf_generation?: Json | null
          status?: string
          strategy?: string
        }
        Update: {
          created_at?: string
          deployed_agent?: Json | null
          id?: string
          sandbox_results?: Json
          scenario_id?: string | null
          score?: number
          sdmf_generation?: Json | null
          status?: string
          strategy?: string
        }
        Relationships: []
      }
      pipeline_runs: {
        Row: {
          created_at: string
          deployed_agent_name: string | null
          deployed_generation_id: number | null
          id: string
          stages: Json
          totals: Json
        }
        Insert: {
          created_at?: string
          deployed_agent_name?: string | null
          deployed_generation_id?: number | null
          id?: string
          stages?: Json
          totals?: Json
        }
        Update: {
          created_at?: string
          deployed_agent_name?: string | null
          deployed_generation_id?: number | null
          id?: string
          stages?: Json
          totals?: Json
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
