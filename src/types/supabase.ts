export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      designers: {
        Row: {
          id: string
          email: string
          name: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          created_at?: string | null
        }
      }
      knitters: {
        Row: {
          id: string
          email: string
          name: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          created_at?: string | null
        }
      }
      mask_counts: {
        Row: {
          id: string
          mask_group_id: string | null
          size_label: string | null
          stitch_count: number | null
        }
        Insert: {
          id?: string
          mask_group_id?: string | null
          size_label?: string | null
          stitch_count?: number | null
        }
        Update: {
          id?: string
          mask_group_id?: string | null
          size_label?: string | null
          stitch_count?: number | null
        }
      }
      mask_groups: {
        Row: {
          id: string
          pattern_step_id: string | null
          title: string | null
        }
        Insert: {
          id?: string
          pattern_step_id?: string | null
          title?: string | null
        }
        Update: {
          id?: string
          pattern_step_id?: string | null
          title?: string | null
        }
      }
      pattern_access: {
        Row: {
          id: string
          knitter_id: string | null
          pattern_id: string | null
          has_access: boolean | null
          progress: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          knitter_id?: string | null
          pattern_id?: string | null
          has_access?: boolean | null
          progress?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          knitter_id?: string | null
          pattern_id?: string | null
          has_access?: boolean | null
          progress?: Json | null
          created_at?: string | null
        }
      }
      pattern_access_tokens: {
        Row: {
          id: string
          token: string
          pattern_id: string | null
          redeemed_by: string | null
          redeemed_at: string | null
          expires_at: string | null
          created_at: string | null
          status: string | null
        }
        Insert: {
          id?: string
          token: string
          pattern_id?: string | null
          redeemed_by?: string | null
          redeemed_at?: string | null
          expires_at?: string | null
          created_at?: string | null
          status?: string | null
        }
        Update: {
          id?: string
          token?: string
          pattern_id?: string | null
          redeemed_by?: string | null
          redeemed_at?: string | null
          expires_at?: string | null
          created_at?: string | null
          status?: string | null
        }
      }
      pattern_progress: {
        Row: {
          user_id: string
          pattern_id: string
          current_step: number | null
          counters: Json | null
          updated_at: string | null
        }
        Insert: {
          user_id: string
          pattern_id: string
          current_step?: number | null
          counters?: Json | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          pattern_id?: string
          current_step?: number | null
          counters?: Json | null
          updated_at?: string | null
        }
      }
      pattern_steps: {
        Row: {
          id: string
          pattern_id: string | null
          step_number: number
          title: string | null
          description: string | null
        }
        Insert: {
          id?: string
          pattern_id?: string | null
          step_number: number
          title?: string | null
          description?: string | null
        }
        Update: {
          id?: string
          pattern_id?: string | null
          step_number?: number
          title?: string | null
          description?: string | null
        }
      }
      patterns: {
        Row: {
          id: string
          designer_id: string | null
          title: string
          description: string | null
          yarn_choice: string | null
          sizes: string[] | null
          steps: Json | null
          paid_only: boolean | null
          created_at: string | null
          is_archived: boolean | null
        }
        Insert: {
          id?: string
          designer_id?: string | null
          title: string
          description?: string | null
          yarn_choice?: string | null
          sizes?: string[] | null
          steps?: Json | null
          paid_only?: boolean | null
          created_at?: string | null
          is_archived?: boolean | null
        }
        Update: {
          id?: string
          designer_id?: string | null
          title?: string
          description?: string | null
          yarn_choice?: string | null
          sizes?: string[] | null
          steps?: Json | null
          paid_only?: boolean | null
          created_at?: string | null
          is_archived?: boolean | null
        }
      }
      roles: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string | null
          role_id: string | null
          tier: string | null
          active: boolean | null
          started_at: string | null
          renewed_at: string | null
          expires_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          role_id?: string | null
          tier?: string | null
          active?: boolean | null
          started_at?: string | null
          renewed_at?: string | null
          expires_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          role_id?: string | null
          tier?: string | null
          active?: boolean | null
          started_at?: string | null
          renewed_at?: string | null
          expires_at?: string | null
        }
      }
      user_patterns: {
        Row: {
          user_id: string
          pattern_id: string
          unlocked_at: string | null
        }
        Insert: {
          user_id: string
          pattern_id: string
          unlocked_at?: string | null
        }
        Update: {
          user_id?: string
          pattern_id?: string
          unlocked_at?: string | null
        }
      }
      user_roles: {
        Row: {
          user_id: string
          role_id: string
        }
        Insert: {
          user_id: string
          role_id: string
        }
        Update: {
          user_id?: string
          role_id?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
        }
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