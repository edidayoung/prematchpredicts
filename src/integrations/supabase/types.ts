export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      daily_picks: {
        Row: {
          away_team: string
          bookmaker: string
          commence_time: string
          confidence: number
          created_at: string
          event_id: string
          final_total: number | null
          home_team: string
          id: string
          line: number
          odds: number
          pick_date: string
          profit: number | null
          reasoning: string
          selection: string
          settled_at: string | null
          sport_key: string
          sport_title: string
          stake: number
          status: string
        }
        Insert: {
          away_team: string
          bookmaker: string
          commence_time: string
          confidence?: number
          created_at?: string
          event_id: string
          final_total?: number | null
          home_team: string
          id?: string
          line: number
          odds: number
          pick_date: string
          profit?: number | null
          reasoning?: string
          selection: string
          settled_at?: string | null
          sport_key: string
          sport_title: string
          stake?: number
          status?: string
        }
        Update: {
          away_team?: string
          bookmaker?: string
          commence_time?: string
          confidence?: number
          created_at?: string
          event_id?: string
          final_total?: number | null
          home_team?: string
          id?: string
          line?: number
          odds?: number
          pick_date?: string
          profit?: number | null
          reasoning?: string
          selection?: string
          settled_at?: string | null
          sport_key?: string
          sport_title?: string
          stake?: number
          status?: string
        }
        Relationships: []
      }
      games: {
        Row: {
          id: string
          game_id: number
          home_team_id: number
          away_team_id: number
          home_team_score: number
          away_team_score: number
          game_date: string
          season: number
          created_at: string
        }
        Insert: {
          id?: string
          game_id: number
          home_team_id: number
          away_team_id: number
          home_team_score: number
          away_team_score: number
          game_date: string
          season: number
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: number
          home_team_id?: number
          away_team_id?: number
          home_team_score?: number
          away_team_score?: number
          game_date?: string
          season?: number
          created_at?: string
        }
        Relationships: []
      }
      nba_teams: {
        Row: {
          id: string
          team_id: number
          team_name: string
          abbreviation: string
          city: string
          conference: string
          division: string
          created_at: string
        }
        Insert: {
          id?: string
          team_id: number
          team_name: string
          abbreviation: string
          city: string
          conference: string
          division: string
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: number
          team_name?: string
          abbreviation?: string
          city?: string
          conference?: string
          division?: string
          created_at?: string
        }
        Relationships: []
      }
      team_stats: {
        Row: {
          id: string
          team_id: number
          season: number
          games_played: number
          avg_points: number
          avg_opp_points: number
          avg_total: number
          over_rate: number
          under_rate: number
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: number
          season: number
          games_played: number
          avg_points: number
          avg_opp_points: number
          avg_total: number
          over_rate: number
          under_rate: number
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: number
          season?: number
          games_played?: number
          avg_points?: number
          avg_opp_points?: number
          avg_total?: number
          over_rate?: number
          under_rate?: number
          updated_at?: string
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
