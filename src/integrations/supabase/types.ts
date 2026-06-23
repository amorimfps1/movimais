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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alunos: {
        Row: {
          aceita_comunicacao: boolean | null
          autorizacao_imagem: boolean | null
          bairro: string | null
          cep: string | null
          cidade: string | null
          cpf: string | null
          cpf_responsavel: string | null
          created_at: string
          data_cadastro: string | null
          data_nascimento: string | null
          email: string | null
          email_responsavel: string | null
          endereco: string | null
          id: string
          nome_completo: string
          nome_responsavel: string | null
          observacoes_medicas: string | null
          origem_primeiro_contato: string | null
          status_cadastral: string | null
          telefone: string | null
          telefone_responsavel: string | null
          uf: string | null
        }
        Insert: {
          aceita_comunicacao?: boolean | null
          autorizacao_imagem?: boolean | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cpf?: string | null
          cpf_responsavel?: string | null
          created_at?: string
          data_cadastro?: string | null
          data_nascimento?: string | null
          email?: string | null
          email_responsavel?: string | null
          endereco?: string | null
          id: string
          nome_completo: string
          nome_responsavel?: string | null
          observacoes_medicas?: string | null
          origem_primeiro_contato?: string | null
          status_cadastral?: string | null
          telefone?: string | null
          telefone_responsavel?: string | null
          uf?: string | null
        }
        Update: {
          aceita_comunicacao?: boolean | null
          autorizacao_imagem?: boolean | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cpf?: string | null
          cpf_responsavel?: string | null
          created_at?: string
          data_cadastro?: string | null
          data_nascimento?: string | null
          email?: string | null
          email_responsavel?: string | null
          endereco?: string | null
          id?: string
          nome_completo?: string
          nome_responsavel?: string | null
          observacoes_medicas?: string | null
          origem_primeiro_contato?: string | null
          status_cadastral?: string | null
          telefone?: string | null
          telefone_responsavel?: string | null
          uf?: string | null
        }
        Relationships: []
      }
      instrutores: {
        Row: {
          ativo: boolean | null
          cpf: string | null
          created_at: string
          email: string | null
          funcao: string | null
          id: string
          nome_completo: string
          telefone: string | null
        }
        Insert: {
          ativo?: boolean | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          funcao?: string | null
          id: string
          nome_completo: string
          telefone?: string | null
        }
        Update: {
          ativo?: boolean | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          funcao?: string | null
          id?: string
          nome_completo?: string
          telefone?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          canal_origem: string | null
          converteu_em_aluno: boolean | null
          cpf: string | null
          created_at: string
          data_entrada: string | null
          data_ultimo_contato: string | null
          email: string | null
          id: string
          modalidade_interesse: string | null
          motivo_nao_conversao: string | null
          nome: string
          observacoes: string | null
          responsavel_atendimento: string | null
          status_lead: string | null
          telefone: string | null
          turma_interesse: string | null
        }
        Insert: {
          canal_origem?: string | null
          converteu_em_aluno?: boolean | null
          cpf?: string | null
          created_at?: string
          data_entrada?: string | null
          data_ultimo_contato?: string | null
          email?: string | null
          id: string
          modalidade_interesse?: string | null
          motivo_nao_conversao?: string | null
          nome: string
          observacoes?: string | null
          responsavel_atendimento?: string | null
          status_lead?: string | null
          telefone?: string | null
          turma_interesse?: string | null
        }
        Update: {
          canal_origem?: string | null
          converteu_em_aluno?: boolean | null
          cpf?: string | null
          created_at?: string
          data_entrada?: string | null
          data_ultimo_contato?: string | null
          email?: string | null
          id?: string
          modalidade_interesse?: string | null
          motivo_nao_conversao?: string | null
          nome?: string
          observacoes?: string | null
          responsavel_atendimento?: string | null
          status_lead?: string | null
          telefone?: string | null
          turma_interesse?: string | null
        }
        Relationships: []
      }
      matriculas: {
        Row: {
          created_at: string
          data_criacao: string | null
          data_fim_prevista: string | null
          data_inicio: string | null
          forma_pagamento: string | null
          id: string
          id_aluno: string | null
          id_modalidade: string | null
          id_turma: string | null
          liberado_para_aula: boolean | null
          observacoes: string | null
          status_matricula: string | null
          tipo_matricula: string | null
          valor_final: number | null
        }
        Insert: {
          created_at?: string
          data_criacao?: string | null
          data_fim_prevista?: string | null
          data_inicio?: string | null
          forma_pagamento?: string | null
          id: string
          id_aluno?: string | null
          id_modalidade?: string | null
          id_turma?: string | null
          liberado_para_aula?: boolean | null
          observacoes?: string | null
          status_matricula?: string | null
          tipo_matricula?: string | null
          valor_final?: number | null
        }
        Update: {
          created_at?: string
          data_criacao?: string | null
          data_fim_prevista?: string | null
          data_inicio?: string | null
          forma_pagamento?: string | null
          id?: string
          id_aluno?: string | null
          id_modalidade?: string | null
          id_turma?: string | null
          liberado_para_aula?: boolean | null
          observacoes?: string | null
          status_matricula?: string | null
          tipo_matricula?: string | null
          valor_final?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "matriculas_id_aluno_fkey"
            columns: ["id_aluno"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriculas_id_modalidade_fkey"
            columns: ["id_modalidade"]
            isOneToOne: false
            referencedRelation: "modalidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriculas_id_turma_fkey"
            columns: ["id_turma"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      modalidades: {
        Row: {
          area: string | null
          created_at: string
          id: string
          nome_modalidade: string
          status: string | null
          valor_padrao: number | null
        }
        Insert: {
          area?: string | null
          created_at?: string
          id: string
          nome_modalidade: string
          status?: string | null
          valor_padrao?: number | null
        }
        Update: {
          area?: string | null
          created_at?: string
          id?: string
          nome_modalidade?: string
          status?: string | null
          valor_padrao?: number | null
        }
        Relationships: []
      }
      pagamentos: {
        Row: {
          ano_referencia: number | null
          created_at: string
          data_pagamento: string | null
          data_vencimento: string | null
          forma_pagamento: string | null
          id: string
          id_aluno: string | null
          id_matricula: string | null
          mes_referencia: number | null
          status_pagamento: string | null
          tipo_lancamento: string | null
          valor_pago: number | null
          valor_previsto: number | null
        }
        Insert: {
          ano_referencia?: number | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          forma_pagamento?: string | null
          id: string
          id_aluno?: string | null
          id_matricula?: string | null
          mes_referencia?: number | null
          status_pagamento?: string | null
          tipo_lancamento?: string | null
          valor_pago?: number | null
          valor_previsto?: number | null
        }
        Update: {
          ano_referencia?: number | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          forma_pagamento?: string | null
          id?: string
          id_aluno?: string | null
          id_matricula?: string | null
          mes_referencia?: number | null
          status_pagamento?: string | null
          tipo_lancamento?: string | null
          valor_pago?: number | null
          valor_previsto?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_id_aluno_fkey"
            columns: ["id_aluno"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_id_matricula_fkey"
            columns: ["id_matricula"]
            isOneToOne: false
            referencedRelation: "matriculas"
            referencedColumns: ["id"]
          },
        ]
      }
      presencas: {
        Row: {
          created_at: string
          data_aula: string
          id: string
          id_aluno: string | null
          id_matricula: string | null
          id_turma: string | null
          presenca: boolean | null
          tipo_registro: string | null
        }
        Insert: {
          created_at?: string
          data_aula: string
          id: string
          id_aluno?: string | null
          id_matricula?: string | null
          id_turma?: string | null
          presenca?: boolean | null
          tipo_registro?: string | null
        }
        Update: {
          created_at?: string
          data_aula?: string
          id?: string
          id_aluno?: string | null
          id_matricula?: string | null
          id_turma?: string | null
          presenca?: boolean | null
          tipo_registro?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "presencas_id_aluno_fkey"
            columns: ["id_aluno"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presencas_id_matricula_fkey"
            columns: ["id_matricula"]
            isOneToOne: false
            referencedRelation: "matriculas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presencas_id_turma_fkey"
            columns: ["id_turma"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          nome: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          nome?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nome?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      turmas: {
        Row: {
          capacidade_maxima: number | null
          created_at: string
          faixa_etaria: string | null
          id: string
          id_modalidade: string | null
          nome_turma: string
          permite_experimental: boolean | null
          status_turma: string | null
        }
        Insert: {
          capacidade_maxima?: number | null
          created_at?: string
          faixa_etaria?: string | null
          id: string
          id_modalidade?: string | null
          nome_turma: string
          permite_experimental?: boolean | null
          status_turma?: string | null
        }
        Update: {
          capacidade_maxima?: number | null
          created_at?: string
          faixa_etaria?: string | null
          id?: string
          id_modalidade?: string | null
          nome_turma?: string
          permite_experimental?: boolean | null
          status_turma?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "turmas_id_modalidade_fkey"
            columns: ["id_modalidade"]
            isOneToOne: false
            referencedRelation: "modalidades"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "secretaria" | "coordenacao" | "instrutor"
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
      app_role: ["secretaria", "coordenacao", "instrutor"],
    },
  },
} as const
