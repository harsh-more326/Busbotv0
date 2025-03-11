export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      bus_stops: {
        Row: {
          id: string
          name: string
          latitude: number
          longitude: number
          priority: number
        }
        Insert: {
          id?: string
          name: string
          latitude: number
          longitude: number
          priority: number
        }
        Update: {
          id?: string
          name?: string
          latitude?: number
          longitude?: number
          priority?: number
        }
        Relationships: []
      }
      depots: {
        Row: {
          id: string
          name: string
          latitude: number
          longitude: number
        }
        Insert: {
          id?: string
          name: string
          latitude: number
          longitude: number
        }
        Update: {
          id?: string
          name?: string
          latitude?: number
          longitude?: number
        }
        Relationships: []
      }
      optimized_routes: {
        Row: {
          id: string
          stops: Json
          distance: number
          duration: number
          buses: number
          frequency: number
          name: string | null
          stops_number: number | null
        }
        Insert: {
          id?: string
          stops: Json
          distance: number
          duration: number
          buses: number
          frequency: number
          name?: string | null
          stops_number?: number | null
        }
        Update: {
          id?: string
          stops?: Json
          distance?: number
          duration?: number
          buses?: number
          frequency?: number
          name?: string | null
          stops_number?: number | null
        }
        Relationships: []
      }
      worker_schedules: {
        Row: {
          id: string
          worker_id: string
          route_id: string
          date: string
          shift: string
          created_at: string
        }
        Insert: {
          id?: string
          worker_id: string
          route_id: string
          date: string
          shift: string
          created_at?: string
        }
        Update: {
          id?: string
          worker_id?: string
          route_id?: string
          date?: string
          shift?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_schedules_route_id_fkey"
            columns: ["route_id"]
            referencedRelation: "optimized_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      workers: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string
          created_at?: string
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

