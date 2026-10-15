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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      addons: {
        Row: {
          coins: number
          id: string
          label: string
          sort: number
        }
        Insert: {
          coins: number
          id: string
          label: string
          sort?: number
        }
        Update: {
          coins?: number
          id?: string
          label?: string
          sort?: number
        }
        Relationships: []
      }
      booking_items: {
        Row: {
          booking_id: string
          cash_ksh: number
          coins: number
          service_id: string
        }
        Insert: {
          booking_id: string
          cash_ksh: number
          coins: number
          service_id: string
        }
        Update: {
          booking_id?: string
          cash_ksh?: number
          coins?: number
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_items_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_pins: {
        Row: {
          booking_id: string
          pin: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          pin: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          pin?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_pins_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          addons: string[]
          cash_ksh: number
          coins: number
          created_at: string
          id: string
          member_profile_id: string
          payout_ksh: number
          provider_id: string
          scheduled_at: string
          status: Database["public"]["Enums"]["booking_status"]
        }
        Insert: {
          addons?: string[]
          cash_ksh: number
          coins: number
          created_at?: string
          id?: string
          member_profile_id: string
          payout_ksh: number
          provider_id: string
          scheduled_at: string
          status?: Database["public"]["Enums"]["booking_status"]
        }
        Update: {
          addons?: string[]
          cash_ksh?: number
          coins?: number
          created_at?: string
          id?: string
          member_profile_id?: string
          payout_ksh?: number
          provider_id?: string
          scheduled_at?: string
          status?: Database["public"]["Enums"]["booking_status"]
        }
        Relationships: [
          {
            foreignKeyName: "bookings_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          name: string
          slug: string
          sort: number
        }
        Insert: {
          name: string
          slug: string
          sort: number
        }
        Update: {
          name?: string
          slug?: string
          sort?: number
        }
        Relationships: []
      }
      coin_rules: {
        Row: {
          group_savings_pct: number
          id: number
          ksh_per_coin: number
          margin_floor_pct: number
          rollover_months: number
          rollover_pct: number
          unlock_fee_pct: number
          updated_at: string
        }
        Insert: {
          group_savings_pct?: number
          id?: number
          ksh_per_coin?: number
          margin_floor_pct?: number
          rollover_months?: number
          rollover_pct?: number
          unlock_fee_pct?: number
          updated_at?: string
        }
        Update: {
          group_savings_pct?: number
          id?: number
          ksh_per_coin?: number
          margin_floor_pct?: number
          rollover_months?: number
          rollover_pct?: number
          unlock_fee_pct?: number
          updated_at?: string
        }
        Relationships: []
      }
      coin_transactions: {
        Row: {
          booking_id: string | null
          coins: number
          created_at: string
          id: number
          kind: string
          note: string | null
          profile_id: string
        }
        Insert: {
          booking_id?: string | null
          coins: number
          created_at?: string
          id?: never
          kind: string
          note?: string | null
          profile_id: string
        }
        Update: {
          booking_id?: string | null
          coins?: number
          created_at?: string
          id?: never
          kind?: string
          note?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coin_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coin_transactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          booking_id: string
          code: string
          created_at: string
          id: string
          member_message: string | null
          outcome: string | null
          provider_message: string | null
          raised_by_profile_id: string
          reason: string
          refund_coins: number | null
          resolution_note: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["dispute_status"]
        }
        Insert: {
          booking_id: string
          code?: string
          created_at?: string
          id?: string
          member_message?: string | null
          outcome?: string | null
          provider_message?: string | null
          raised_by_profile_id: string
          reason: string
          refund_coins?: number | null
          resolution_note?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
        }
        Update: {
          booking_id?: string
          code?: string
          created_at?: string
          id?: string
          member_message?: string | null
          outcome?: string | null
          provider_message?: string | null
          raised_by_profile_id?: string
          reason?: string
          refund_coins?: number | null
          resolution_note?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
        }
        Relationships: [
          {
            foreignKeyName: "disputes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_raised_by_profile_id_fkey"
            columns: ["raised_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_bands: {
        Row: {
          class: Database["public"]["Enums"]["tier_id"]
          default_pct: number
          max_pct: number
          min_pct: number
        }
        Insert: {
          class: Database["public"]["Enums"]["tier_id"]
          default_pct: number
          max_pct: number
          min_pct: number
        }
        Update: {
          class?: Database["public"]["Enums"]["tier_id"]
          default_pct?: number
          max_pct?: number
          min_pct?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          area: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          renews_on: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["member_status"]
          tier: Database["public"]["Enums"]["tier_id"] | null
          user_id: string | null
        }
        Insert: {
          area?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
          renews_on?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["member_status"]
          tier?: Database["public"]["Enums"]["tier_id"] | null
          user_id?: string | null
        }
        Update: {
          area?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          renews_on?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["member_status"]
          tier?: Database["public"]["Enums"]["tier_id"] | null
          user_id?: string | null
        }
        Relationships: []
      }
      providers: {
        Row: {
          about: string | null
          application_ref: string | null
          applied_at: string
          area: string
          class: Database["public"]["Enums"]["tier_id"]
          cover_url: string | null
          created_at: string
          home_visits: boolean
          hours: Json
          id: string
          kind: string | null
          kyc_docs: string[]
          name: string
          owner_name: string | null
          owner_profile_id: string | null
          payout_method: string | null
          payout_pct: number
          photo_url: string | null
          rating: number | null
          review_count: number
          slug: string
          status: Database["public"]["Enums"]["provider_status"]
          verified: boolean
        }
        Insert: {
          about?: string | null
          application_ref?: string | null
          applied_at?: string
          area: string
          class: Database["public"]["Enums"]["tier_id"]
          cover_url?: string | null
          created_at?: string
          home_visits?: boolean
          hours?: Json
          id?: string
          kind?: string | null
          kyc_docs?: string[]
          name: string
          owner_name?: string | null
          owner_profile_id?: string | null
          payout_method?: string | null
          payout_pct: number
          photo_url?: string | null
          rating?: number | null
          review_count?: number
          slug: string
          status?: Database["public"]["Enums"]["provider_status"]
          verified?: boolean
        }
        Update: {
          about?: string | null
          application_ref?: string | null
          applied_at?: string
          area?: string
          class?: Database["public"]["Enums"]["tier_id"]
          cover_url?: string | null
          created_at?: string
          home_visits?: boolean
          hours?: Json
          id?: string
          kind?: string | null
          kyc_docs?: string[]
          name?: string
          owner_name?: string | null
          owner_profile_id?: string | null
          payout_method?: string | null
          payout_pct?: number
          photo_url?: string | null
          rating?: number | null
          review_count?: number
          slug?: string
          status?: Database["public"]["Enums"]["provider_status"]
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "providers_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          author_name: string
          author_profile_id: string | null
          author_tier: Database["public"]["Enums"]["tier_id"] | null
          body: string | null
          booking_id: string | null
          created_at: string
          id: string
          provider_id: string
          rating: number
        }
        Insert: {
          author_name: string
          author_profile_id?: string | null
          author_tier?: Database["public"]["Enums"]["tier_id"] | null
          body?: string | null
          booking_id?: string | null
          created_at?: string
          id?: string
          provider_id: string
          rating: number
        }
        Update: {
          author_name?: string
          author_profile_id?: string | null
          author_tier?: Database["public"]["Enums"]["tier_id"] | null
          body?: string | null
          booking_id?: string | null
          created_at?: string
          id?: string
          provider_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          cash_ksh: number
          category: string
          created_at: string
          id: string
          image_url: string | null
          minutes: number
          name: string
          popular_rank: number | null
          provider_id: string
          section: string | null
          sort: number
        }
        Insert: {
          active?: boolean
          cash_ksh: number
          category: string
          created_at?: string
          id?: string
          image_url?: string | null
          minutes: number
          name: string
          popular_rank?: number | null
          provider_id: string
          section?: string | null
          sort?: number
        }
        Update: {
          active?: boolean
          cash_ksh?: number
          category?: string
          created_at?: string
          id?: string
          image_url?: string | null
          minutes?: number
          name?: string
          popular_rank?: number | null
          provider_id?: string
          section?: string | null
          sort?: number
        }
        Relationships: [
          {
            foreignKeyName: "services_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      tiers: {
        Row: {
          badge: string | null
          discount: number
          id: Database["public"]["Enums"]["tier_id"]
          monthly_coins: number
          name: string
          perks: string[]
          price_ksh: number
          sort: number
        }
        Insert: {
          badge?: string | null
          discount: number
          id: Database["public"]["Enums"]["tier_id"]
          monthly_coins: number
          name: string
          perks?: string[]
          price_ksh: number
          sort: number
        }
        Update: {
          badge?: string | null
          discount?: number
          id?: Database["public"]["Enums"]["tier_id"]
          monthly_coins?: number
          name?: string
          perks?: string[]
          price_ksh?: number
          sort?: number
        }
        Relationships: []
      }
      wallets: {
        Row: {
          available: number
          on_hold: number
          profile_id: string
          rollover: number
          updated_at: string
        }
        Insert: {
          available?: number
          on_hold?: number
          profile_id: string
          rollover?: number
          updated_at?: string
        }
        Update: {
          available?: number
          on_hold?: number
          profile_id?: string
          rollover?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_as_provider: {
        Args: {
          p_name: string
          p_kind: string
          p_area: string
          p_phone: string
          p_email: string
          p_social?: string
          p_home_visits?: boolean
          p_team_size?: string
          p_class?: string
          p_services?: string
          p_payout_method?: string
          p_payout_details?: string
          p_kyc_docs?: string[]
        }
        Returns: Json
      }
      submit_contact_message: {
        Args: {
          p_who: string
          p_full_name: string
          p_phone: string
          p_topic: string
          p_message: string
        }
        Returns: string
      }
      submit_teams_enquiry: {
        Args: {
          p_company_name: string
          p_work_email: string
          p_team_size: string
          p_phone: string
          p_notes?: string
        }
        Returns: number
      }
      submit_waitlist: {
        Args: {
          p_intent: string
          p_area: string
          p_phone: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "member" | "provider" | "admin" | "hr"
      booking_status:
        | "booked"
        | "arriving"
        | "in_progress"
        | "done"
        | "cancelled"
        | "no_show"
      dispute_status: "new" | "waiting_provider" | "waiting_member" | "resolved"
      member_status: "active" | "renewal_failed" | "cancelled"
      provider_status: "applied" | "live" | "paused" | "rejected"
      tier_id: "basic" | "intermediate" | "premium"
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
    Enums: {
      app_role: ["member", "provider", "admin", "hr"],
      booking_status: [
        "booked",
        "arriving",
        "in_progress",
        "done",
        "cancelled",
        "no_show",
      ],
      dispute_status: ["new", "waiting_provider", "waiting_member", "resolved"],
      member_status: ["active", "renewal_failed", "cancelled"],
      provider_status: ["applied", "live", "paused", "rejected"],
      tier_id: ["basic", "intermediate", "premium"],
    },
  },
} as const
