/**
 * Database types for StrongoBongo
 * Generated from Supabase schema
 */

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
      routines: {
        Row: {
          id: string
          name: string
          created_at: string
          session_id: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          session_id: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          session_id?: string
        }
      }
      exercises: {
        Row: {
          id: string
          name: string
          muscle_group: string
          equipment: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          muscle_group: string
          equipment: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          muscle_group?: string
          equipment?: string
          created_at?: string
        }
      }
      routine_exercises: {
        Row: {
          id: string
          routine_id: string
          exercise_id: string
          order_index: number
          target_sets: number
          target_reps: number
          target_weight_kg: number | null
          target_rest_seconds: number
          created_at: string
        }
        Insert: {
          id?: string
          routine_id: string
          exercise_id: string
          order_index: number
          target_sets?: number
          target_reps?: number
          target_weight_kg?: number | null
          target_rest_seconds?: number
          created_at?: string
        }
        Update: {
          id?: string
          routine_id?: string
          exercise_id?: string
          order_index?: number
          target_sets?: number
          target_reps?: number
          target_weight_kg?: number | null
          target_rest_seconds?: number
          created_at?: string
        }
      }
      workout_sessions: {
        Row: {
          id: string
          routine_id: string
          session_id: string
          started_at: string
          ended_at: string | null
          total_duration_seconds: number | null
        }
        Insert: {
          id?: string
          routine_id: string
          session_id: string
          started_at?: string
          ended_at?: string | null
          total_duration_seconds?: number | null
        }
        Update: {
          id?: string
          routine_id?: string
          session_id?: string
          started_at?: string
          ended_at?: string | null
          total_duration_seconds?: number | null
        }
      }
      session_sets: {
        Row: {
          id: string
          session_id: string
          exercise_id: string
          reps: number
          weight_kg: number | null
          completed_at: string
        }
        Insert: {
          id?: string
          session_id: string
          exercise_id: string
          reps: number
          weight_kg?: number | null
          completed_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          exercise_id?: string
          reps?: number
          weight_kg?: number | null
          completed_at?: string
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
  }
}
