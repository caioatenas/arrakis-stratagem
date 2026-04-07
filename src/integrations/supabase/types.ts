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
      acoes: {
        Row: {
          created_at: string
          destino_id: string | null
          id: string
          origem_id: string | null
          partida_id: string
          player_id: string
          quantidade: number | null
          tipo: Database["public"]["Enums"]["action_type"]
          turno_id: string
        }
        Insert: {
          created_at?: string
          destino_id?: string | null
          id?: string
          origem_id?: string | null
          partida_id: string
          player_id: string
          quantidade?: number | null
          tipo: Database["public"]["Enums"]["action_type"]
          turno_id: string
        }
        Update: {
          created_at?: string
          destino_id?: string | null
          id?: string
          origem_id?: string | null
          partida_id?: string
          player_id?: string
          quantidade?: number | null
          tipo?: Database["public"]["Enums"]["action_type"]
          turno_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acoes_partida_id_fkey"
            columns: ["partida_id"]
            isOneToOne: false
            referencedRelation: "partidas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acoes_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acoes_turno_id_fkey"
            columns: ["turno_id"]
            isOneToOne: false
            referencedRelation: "turnos"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos: {
        Row: {
          created_at: string
          descricao: string
          id: string
          partida_id: string
          territorios_afetados: string[] | null
          tipo: Database["public"]["Enums"]["event_type"]
          turno_id: string
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          partida_id: string
          territorios_afetados?: string[] | null
          tipo: Database["public"]["Enums"]["event_type"]
          turno_id: string
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          partida_id?: string
          territorios_afetados?: string[] | null
          tipo?: Database["public"]["Enums"]["event_type"]
          turno_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_partida_id_fkey"
            columns: ["partida_id"]
            isOneToOne: false
            referencedRelation: "partidas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_turno_id_fkey"
            columns: ["turno_id"]
            isOneToOne: false
            referencedRelation: "turnos"
            referencedColumns: ["id"]
          },
        ]
      }
      game_logs: {
        Row: {
          created_at: string
          dados: Json | null
          id: string
          mensagem: string
          nivel: Database["public"]["Enums"]["log_level"]
          partida_id: string
          player_id: string | null
          turno_numero: number
        }
        Insert: {
          created_at?: string
          dados?: Json | null
          id?: string
          mensagem: string
          nivel?: Database["public"]["Enums"]["log_level"]
          partida_id: string
          player_id?: string | null
          turno_numero: number
        }
        Update: {
          created_at?: string
          dados?: Json | null
          id?: string
          mensagem?: string
          nivel?: Database["public"]["Enums"]["log_level"]
          partida_id?: string
          player_id?: string | null
          turno_numero?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_logs_partida_id_fkey"
            columns: ["partida_id"]
            isOneToOne: false
            referencedRelation: "partidas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_logs_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      matchmaking_queue: {
        Row: {
          id: string
          joined_at: string
          player_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          player_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matchmaking_queue_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      partidas: {
        Row: {
          code: string | null
          created_at: string
          host_id: string | null
          id: string
          map: string | null
          max_jogadores: number
          status: Database["public"]["Enums"]["game_status"]
          turn_time: number | null
          turno_atual: number
          updated_at: string
          vencedor_id: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          host_id?: string | null
          id?: string
          map?: string | null
          max_jogadores?: number
          status?: Database["public"]["Enums"]["game_status"]
          turn_time?: number | null
          turno_atual?: number
          updated_at?: string
          vencedor_id?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          host_id?: string | null
          id?: string
          map?: string | null
          max_jogadores?: number
          status?: Database["public"]["Enums"]["game_status"]
          turn_time?: number | null
          turno_atual?: number
          updated_at?: string
          vencedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partidas_vencedor_id_fkey"
            columns: ["vencedor_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_estado: {
        Row: {
          acoes_restantes: number
          ativo: boolean
          cor: string
          created_at: string
          house: string | null
          id: string
          partida_id: string
          player_id: string
          spice: number
        }
        Insert: {
          acoes_restantes?: number
          ativo?: boolean
          cor?: string
          created_at?: string
          house?: string | null
          id?: string
          partida_id: string
          player_id: string
          spice?: number
        }
        Update: {
          acoes_restantes?: number
          ativo?: boolean
          cor?: string
          created_at?: string
          house?: string | null
          id?: string
          partida_id?: string
          player_id?: string
          spice?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_estado_partida_id_fkey"
            columns: ["partida_id"]
            isOneToOne: false
            referencedRelation: "partidas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_estado_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          created_at: string
          display_name: string
          games_played: number
          games_won: number
          id: string
          spice_total: number
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          games_played?: number
          games_won?: number
          id?: string
          spice_total?: number
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          games_played?: number
          games_won?: number
          id?: string
          spice_total?: number
          user_id?: string
        }
        Relationships: []
      }
      territorios: {
        Row: {
          defesa_base: number
          dono_id: string | null
          forca: number
          id: string
          nome: string
          partida_id: string
          pos_x: number
          pos_y: number
          producao_spice: number
          regiao: string
          tipo: string
          vizinhos: string[]
        }
        Insert: {
          defesa_base?: number
          dono_id?: string | null
          forca?: number
          id: string
          nome: string
          partida_id: string
          pos_x?: number
          pos_y?: number
          producao_spice?: number
          regiao?: string
          tipo?: string
          vizinhos?: string[]
        }
        Update: {
          defesa_base?: number
          dono_id?: string | null
          forca?: number
          id?: string
          nome?: string
          partida_id?: string
          pos_x?: number
          pos_y?: number
          producao_spice?: number
          regiao?: string
          tipo?: string
          vizinhos?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "territorios_dono_id_fkey"
            columns: ["dono_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "territorios_partida_id_fkey"
            columns: ["partida_id"]
            isOneToOne: false
            referencedRelation: "partidas"
            referencedColumns: ["id"]
          },
        ]
      }
      turnos: {
        Row: {
          created_at: string
          id: string
          numero: number
          partida_id: string
          resolved_at: string | null
          resolvido: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          numero: number
          partida_id: string
          resolved_at?: string | null
          resolvido?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          numero?: number
          partida_id?: string
          resolved_at?: string | null
          resolvido?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "turnos_partida_id_fkey"
            columns: ["partida_id"]
            isOneToOne: false
            referencedRelation: "partidas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_game_participant: {
        Args: { _partida_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      action_type: "mover" | "atacar" | "fortificar" | "espionar" | "extrair"
      event_type: "tempestade" | "vermes" | "superproducao" | "instabilidade"
      game_status: "waiting" | "in_progress" | "finished"
      log_level: "interno" | "jogador" | "publico"
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
      action_type: ["mover", "atacar", "fortificar", "espionar", "extrair"],
      event_type: ["tempestade", "vermes", "superproducao", "instabilidade"],
      game_status: ["waiting", "in_progress", "finished"],
      log_level: ["interno", "jogador", "publico"],
    },
  },
} as const
