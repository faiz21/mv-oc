// Auto-generate with: supabase gen types typescript --local > src/types/database.ts
// This is a skeleton — replace with generated output after running migrations

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'operator' | 'viewer'
          status: 'active' | 'inactive' | 'invited' | 'suspended'
          timezone: string
          avatar_url: string | null
          gamification_enabled: boolean
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      workflows: {
        Row: {
          id: string
          key: string
          name: string
          description: string | null
          status: 'draft' | 'active' | 'inactive'
          primary_agent_id: string | null
          requires_approval: boolean
          requires_approval_reason: string | null
          active_version_id: string | null
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['workflows']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['workflows']['Insert']>
      }
      workflow_runs: {
        Row: {
          id: string
          workflow_id: string
          workflow_version_id: string
          trigger_type: string
          trigger_ref: string | null
          status: 'pending' | 'running' | 'awaiting_approval' | 'paused' | 'complete' | 'failed' | 'cancelled'
          correlation_id: string | null
          project_key: string | null
          entity_id: string | null
          initiated_by: string | null
          current_step_run_id: string | null
          input_payload: Json
          context_packet_id: string | null
          sla_due_at: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['workflow_runs']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['workflow_runs']['Insert']>
      }
      approval_queue: {
        Row: {
          id: string
          task_id: string | null
          workflow_run_id: string | null
          task_item_id: string | null
          source_type: string
          source_ref: string
          gate_type: 'outbound-message' | 'task-result' | 'document' | 'publish'
          status: 'awaiting_review' | 'approved' | 'rejected' | 'expired'
          content: Json
          submitted_by: string | null
          assigned_reviewer_id: string | null
          reviewed_by: string | null
          decision: 'approved' | 'rejected' | null
          notes: string | null
          notified_at: string | null
          expires_at: string | null
          decision_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['approval_queue']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['approval_queue']['Insert']>
      }
      audit_log: {
        Row: {
          id: number
          entity_type: string
          entity_id: string
          task_id: string | null
          workflow_id: string | null
          workflow_run_id: string | null
          actor_type: 'system' | 'agent' | 'human'
          actor_ref: string | null
          event: string
          data: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['audit_log']['Row'], 'id' | 'created_at'>
        Update: never
      }
      agents: {
        Row: {
          id: string
          name: string
          description: string | null
          openclaw_endpoint: string
          status: 'active' | 'inactive' | 'unreachable'
          capabilities: Json
          last_seen: string | null
          error_rate_24h: number | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['agents']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['agents']['Insert']>
      }
      tasks: {
        Row: {
          id: string
          workflow_run_id: string | null
          workflow_run_step_id: string | null
          workflow_id: string | null
          workflow_version_id: string | null
          type: string
          status: 'pending' | 'queued' | 'running' | 'awaiting_approval' | 'approved' | 'complete' | 'failed' | 'rejected' | 'cancelled'
          title: string | null
          source: string | null
          source_ref: string | null
          assigned_to: string | null
          agent_id: string | null
          correlation_id: string | null
          parent_task_id: string | null
          context: Json
          payload: Json
          result: Json | null
          approved_by: string | null
          attempt_count: number
          due_at: string | null
          priority: number
          error: string | null
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>
      }
      system_state: {
        Row: {
          key: string
          value: Json
          updated_by: string | null
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['system_state']['Row'], 'updated_at'>
        Update: Partial<Database['public']['Tables']['system_state']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: {
      match_memory_vectors: {
        Args: {
          query_embedding: string
          match_threshold: number
          match_count: number
          filter_scope?: string
          filter_entity_id?: string
          filter_scope_ref?: string
        }
        Returns: Array<{ id: string; scope: string; content: string; similarity: number }>
      }
    }
    Enums: Record<string, never>
  }
}
