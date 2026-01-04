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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          password_hash: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          password_hash: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          password_hash?: string
          user_id?: string | null
        }
        Relationships: []
      }
      facilities: {
        Row: {
          amenities: string | null
          capacity: number
          category: Database["public"]["Enums"]["facility_category"]
          created_at: string
          id: string
          is_active: boolean
          location: string
          name: string
          quantity_total: number
          rules: string | null
        }
        Insert: {
          amenities?: string | null
          capacity?: number
          category?: Database["public"]["Enums"]["facility_category"]
          created_at?: string
          id?: string
          is_active?: boolean
          location: string
          name: string
          quantity_total?: number
          rules?: string | null
        }
        Update: {
          amenities?: string | null
          capacity?: number
          category?: Database["public"]["Enums"]["facility_category"]
          created_at?: string
          id?: string
          is_active?: boolean
          location?: string
          name?: string
          quantity_total?: number
          rules?: string | null
        }
        Relationships: []
      }
      requests: {
        Row: {
          admin_note: string | null
          borrower_org: string
          created_at: string
          document_url: string | null
          end_datetime: string
          facility_id: string
          id: string
          notes: string | null
          purpose: string
          quantity_requested: number
          start_datetime: string
          status: Database["public"]["Enums"]["request_status"]
          student_id: string
          updated_at: string
          usage_purpose: string
        }
        Insert: {
          admin_note?: string | null
          borrower_org?: string
          created_at?: string
          document_url?: string | null
          end_datetime: string
          facility_id: string
          id?: string
          notes?: string | null
          purpose: string
          quantity_requested?: number
          start_datetime: string
          status?: Database["public"]["Enums"]["request_status"]
          student_id: string
          updated_at?: string
          usage_purpose?: string
        }
        Update: {
          admin_note?: string | null
          borrower_org?: string
          created_at?: string
          document_url?: string | null
          end_datetime?: string
          facility_id?: string
          id?: string
          notes?: string | null
          purpose?: string
          quantity_requested?: number
          start_datetime?: string
          status?: Database["public"]["Enums"]["request_status"]
          student_id?: string
          updated_at?: string
          usage_purpose?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      status_logs: {
        Row: {
          admin_id: string | null
          changed_at: string
          id: string
          new_status: Database["public"]["Enums"]["request_status"]
          old_status: Database["public"]["Enums"]["request_status"] | null
          request_id: string
        }
        Insert: {
          admin_id?: string | null
          changed_at?: string
          id?: string
          new_status: Database["public"]["Enums"]["request_status"]
          old_status?: Database["public"]["Enums"]["request_status"] | null
          request_id: string
        }
        Update: {
          admin_id?: string | null
          changed_at?: string
          id?: string
          new_status?: Database["public"]["Enums"]["request_status"]
          old_status?: Database["public"]["Enums"]["request_status"] | null
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "status_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "status_logs_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          nim: string | null
          phone: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          nim?: string | null
          phone: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          nim?: string | null
          phone?: string
        }
        Relationships: []
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
      app_role: "admin" | "super_admin"
      facility_category: "RUANGAN" | "BARANG" | "KENDARAAN"
      request_status:
        | "DIAJUKAN"
        | "DISETUJUI"
        | "DIPROSES"
        | "SELESAI"
        | "DITOLAK"
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
      app_role: ["admin", "super_admin"],
      facility_category: ["RUANGAN", "BARANG", "KENDARAAN"],
      request_status: [
        "DIAJUKAN",
        "DISETUJUI",
        "DIPROSES",
        "SELESAI",
        "DITOLAK",
      ],
    },
  },
} as const
