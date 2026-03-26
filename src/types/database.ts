export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      agent_daily_summaries: {
        Row: {
          agent_id: string | null
          approval_count: number | null
          created_at: string | null
          date: string
          error_count: number | null
          id: string
          key_patterns: Json | null
          step_count: number | null
          summary: string | null
          task_count: number | null
          token_used: number | null
          top_workflows: Json | null
        }
        Insert: {
          agent_id?: string | null
          approval_count?: number | null
          created_at?: string | null
          date: string
          error_count?: number | null
          id?: string
          key_patterns?: Json | null
          step_count?: number | null
          summary?: string | null
          task_count?: number | null
          token_used?: number | null
          top_workflows?: Json | null
        }
        Update: {
          agent_id?: string | null
          approval_count?: number | null
          created_at?: string | null
          date?: string
          error_count?: number | null
          id?: string
          key_patterns?: Json | null
          step_count?: number | null
          summary?: string | null
          task_count?: number | null
          token_used?: number | null
          top_workflows?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_daily_summaries_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_definition_versions: {
        Row: {
          agent_definition_id: string
          change_summary: string | null
          created_at: string
          id: string
          saved_by: string | null
          snapshot: Json
          version_number: number
        }
        Insert: {
          agent_definition_id: string
          change_summary?: string | null
          created_at?: string
          id?: string
          saved_by?: string | null
          snapshot: Json
          version_number: number
        }
        Update: {
          agent_definition_id?: string
          change_summary?: string | null
          created_at?: string
          id?: string
          saved_by?: string | null
          snapshot?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "agent_definition_versions_agent_definition_id_fkey"
            columns: ["agent_definition_id"]
            isOneToOne: false
            referencedRelation: "agent_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_definition_versions_saved_by_fkey"
            columns: ["saved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_definitions: {
        Row: {
          agent_key: string
          agent_type: string
          allowed_tools: Json
          capabilities: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          memory_policy: Json
          name: string
          parent_definition_id: string | null
          published_agent_id: string | null
          published_at: string | null
          role_summary: string | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          agent_key: string
          agent_type: string
          allowed_tools?: Json
          capabilities?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          memory_policy?: Json
          name: string
          parent_definition_id?: string | null
          published_agent_id?: string | null
          published_at?: string | null
          role_summary?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          agent_key?: string
          agent_type?: string
          allowed_tools?: Json
          capabilities?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          memory_policy?: Json
          name?: string
          parent_definition_id?: string | null
          published_agent_id?: string | null
          published_at?: string | null
          role_summary?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_definitions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_definitions_parent_definition_id_fkey"
            columns: ["parent_definition_id"]
            isOneToOne: false
            referencedRelation: "agent_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_definitions_published_agent_id_fkey"
            columns: ["published_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_definitions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_group_members: {
        Row: {
          agent_group_id: string
          agent_id: string
          created_at: string
          id: string
          membership_role: string
        }
        Insert: {
          agent_group_id: string
          agent_id: string
          created_at?: string
          id?: string
          membership_role?: string
        }
        Update: {
          agent_group_id?: string
          agent_id?: string
          created_at?: string
          id?: string
          membership_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_group_members_agent_group_id_fkey"
            columns: ["agent_group_id"]
            isOneToOne: false
            referencedRelation: "agent_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_group_members_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_groups: {
        Row: {
          created_at: string
          description: string | null
          group_key: string
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          group_key: string
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          group_key?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      agent_lessons_learned: {
        Row: {
          agent_id: string | null
          applies_to: Json | null
          confidence: number | null
          confirmed_count: number | null
          context: string | null
          created_at: string | null
          embedding: string | null
          id: string
          lesson: string
          source_ref: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          applies_to?: Json | null
          confidence?: number | null
          confirmed_count?: number | null
          context?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          lesson: string
          source_ref?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          applies_to?: Json | null
          confidence?: number | null
          confirmed_count?: number | null
          context?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          lesson?: string
          source_ref?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_lessons_learned_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_relationships: {
        Row: {
          child_agent_id: string
          created_at: string
          id: string
          parent_agent_id: string
          relationship_type: string
          sort_order: number
        }
        Insert: {
          child_agent_id: string
          created_at?: string
          id?: string
          parent_agent_id: string
          relationship_type: string
          sort_order?: number
        }
        Update: {
          child_agent_id?: string
          created_at?: string
          id?: string
          parent_agent_id?: string
          relationship_type?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "agent_relationships_child_agent_id_fkey"
            columns: ["child_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_relationships_parent_agent_id_fkey"
            columns: ["parent_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_skill_links: {
        Row: {
          agent_definition_id: string
          created_at: string
          id: string
          link_type: string
          skill_definition_id: string
        }
        Insert: {
          agent_definition_id: string
          created_at?: string
          id?: string
          link_type: string
          skill_definition_id: string
        }
        Update: {
          agent_definition_id?: string
          created_at?: string
          id?: string
          link_type?: string
          skill_definition_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_skill_links_agent_definition_id_fkey"
            columns: ["agent_definition_id"]
            isOneToOne: false
            referencedRelation: "agent_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_skill_links_skill_definition_id_fkey"
            columns: ["skill_definition_id"]
            isOneToOne: false
            referencedRelation: "skill_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          capabilities: Json
          created_at: string
          deleted_at: string | null
          department_id: string | null
          description: string | null
          error_rate_24h: number | null
          id: string
          last_seen: string | null
          name: string
          openclaw_endpoint: string
          status: string
          updated_at: string
        }
        Insert: {
          capabilities?: Json
          created_at?: string
          deleted_at?: string | null
          department_id?: string | null
          description?: string | null
          error_rate_24h?: number | null
          id: string
          last_seen?: string | null
          name: string
          openclaw_endpoint: string
          status?: string
          updated_at?: string
        }
        Update: {
          capabilities?: Json
          created_at?: string
          deleted_at?: string | null
          department_id?: string | null
          description?: string | null
          error_rate_24h?: number | null
          id?: string
          last_seen?: string | null
          name?: string
          openclaw_endpoint?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agents_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_queue: {
        Row: {
          assigned_reviewer_id: string | null
          content: Json
          created_at: string
          decision: string | null
          decision_at: string | null
          expires_at: string | null
          gate_type: string
          id: string
          notes: string | null
          notified_at: string | null
          reviewed_by: string | null
          source_ref: string
          source_type: string
          status: string
          submitted_by: string | null
          task_id: string | null
          task_item_id: string | null
          updated_at: string
          workflow_run_id: string | null
        }
        Insert: {
          assigned_reviewer_id?: string | null
          content: Json
          created_at?: string
          decision?: string | null
          decision_at?: string | null
          expires_at?: string | null
          gate_type: string
          id?: string
          notes?: string | null
          notified_at?: string | null
          reviewed_by?: string | null
          source_ref: string
          source_type: string
          status?: string
          submitted_by?: string | null
          task_id?: string | null
          task_item_id?: string | null
          updated_at?: string
          workflow_run_id?: string | null
        }
        Update: {
          assigned_reviewer_id?: string | null
          content?: Json
          created_at?: string
          decision?: string | null
          decision_at?: string | null
          expires_at?: string | null
          gate_type?: string
          id?: string
          notes?: string | null
          notified_at?: string | null
          reviewed_by?: string | null
          source_ref?: string
          source_type?: string
          status?: string
          submitted_by?: string | null
          task_id?: string | null
          task_item_id?: string | null
          updated_at?: string
          workflow_run_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_queue_assigned_reviewer_id_fkey"
            columns: ["assigned_reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_queue_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_queue_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_queue_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_queue_task_item_id_fkey"
            columns: ["task_item_id"]
            isOneToOne: false
            referencedRelation: "task_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_queue_workflow_run_id_fkey"
            columns: ["workflow_run_id"]
            isOneToOne: false
            referencedRelation: "workflow_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      artifacts: {
        Row: {
          artifact_type: string
          content: Json | null
          correlation_id: string | null
          created_at: string
          created_by_ref: string | null
          created_by_type: string
          file_path: string | null
          id: string
          storage_key: string | null
          storage_kind: string
          task_id: string | null
          task_item_id: string | null
          title: string
          workflow_run_id: string | null
          workflow_run_step_id: string | null
        }
        Insert: {
          artifact_type: string
          content?: Json | null
          correlation_id?: string | null
          created_at?: string
          created_by_ref?: string | null
          created_by_type: string
          file_path?: string | null
          id?: string
          storage_key?: string | null
          storage_kind: string
          task_id?: string | null
          task_item_id?: string | null
          title: string
          workflow_run_id?: string | null
          workflow_run_step_id?: string | null
        }
        Update: {
          artifact_type?: string
          content?: Json | null
          correlation_id?: string | null
          created_at?: string
          created_by_ref?: string | null
          created_by_type?: string
          file_path?: string | null
          id?: string
          storage_key?: string | null
          storage_kind?: string
          task_id?: string | null
          task_item_id?: string | null
          title?: string
          workflow_run_id?: string | null
          workflow_run_step_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artifacts_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifacts_task_item_id_fkey"
            columns: ["task_item_id"]
            isOneToOne: false
            referencedRelation: "task_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifacts_workflow_run_id_fkey"
            columns: ["workflow_run_id"]
            isOneToOne: false
            referencedRelation: "workflow_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifacts_workflow_run_step_id_fkey"
            columns: ["workflow_run_step_id"]
            isOneToOne: false
            referencedRelation: "workflow_run_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          actor_ref: string | null
          actor_type: string
          created_at: string
          data: Json | null
          entity_id: string
          entity_type: string
          event: string
          id: number
          task_id: string | null
          workflow_id: string | null
          workflow_run_id: string | null
        }
        Insert: {
          actor_ref?: string | null
          actor_type: string
          created_at?: string
          data?: Json | null
          entity_id: string
          entity_type: string
          event: string
          id?: number
          task_id?: string | null
          workflow_id?: string | null
          workflow_run_id?: string | null
        }
        Update: {
          actor_ref?: string | null
          actor_type?: string
          created_at?: string
          data?: Json | null
          entity_id?: string
          entity_type?: string
          event?: string
          id?: number
          task_id?: string | null
          workflow_id?: string | null
          workflow_run_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_workflow_run_id_fkey"
            columns: ["workflow_run_id"]
            isOneToOne: false
            referencedRelation: "workflow_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_job_runs: {
        Row: {
          automation_job_id: string
          completed_at: string | null
          created_at: string
          duration_ms: number | null
          error: string | null
          id: string
          started_at: string | null
          status: string
          task_id: string | null
          workflow_run_id: string | null
        }
        Insert: {
          automation_job_id: string
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          started_at?: string | null
          status: string
          task_id?: string | null
          workflow_run_id?: string | null
        }
        Update: {
          automation_job_id?: string
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          started_at?: string | null
          status?: string
          task_id?: string | null
          workflow_run_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_job_runs_automation_job_id_fkey"
            columns: ["automation_job_id"]
            isOneToOne: false
            referencedRelation: "automation_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_job_runs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_job_runs_workflow_run_id_fkey"
            columns: ["workflow_run_id"]
            isOneToOne: false
            referencedRelation: "workflow_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_jobs: {
        Row: {
          created_at: string
          id: string
          job_key: string
          last_run_at: string | null
          name: string
          next_run_at: string | null
          owner_ref: string
          owner_type: string
          schedule_expression: string | null
          schedule_type: string
          source_of_truth: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_key: string
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          owner_ref: string
          owner_type: string
          schedule_expression?: string | null
          schedule_type: string
          source_of_truth: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          job_key?: string
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          owner_ref?: string
          owner_type?: string
          schedule_expression?: string | null
          schedule_type?: string
          source_of_truth?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          created_at: string
          description: string
          icon_url: string | null
          id: string
          name: string
          rarity: string
          unlock_condition: string
        }
        Insert: {
          created_at?: string
          description: string
          icon_url?: string | null
          id: string
          name: string
          rarity?: string
          unlock_condition: string
        }
        Update: {
          created_at?: string
          description?: string
          icon_url?: string | null
          id?: string
          name?: string
          rarity?: string
          unlock_condition?: string
        }
        Relationships: []
      }
      badges_earned: {
        Row: {
          awarded_at: string
          badge_id: string
          id: string
          is_active: boolean
          user_id: string
        }
        Insert: {
          awarded_at?: string
          badge_id: string
          id?: string
          is_active?: boolean
          user_id: string
        }
        Update: {
          awarded_at?: string
          badge_id?: string
          id?: string
          is_active?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "badges_earned_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "badges_earned_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      board_columns: {
        Row: {
          allowed_roles: string[]
          auto_advance_on_approval: boolean
          color: string | null
          created_at: string
          department_id: string
          id: string
          is_done_state: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          allowed_roles?: string[]
          auto_advance_on_approval?: boolean
          color?: string | null
          created_at?: string
          department_id: string
          id?: string
          is_done_state?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          allowed_roles?: string[]
          auto_advance_on_approval?: boolean
          color?: string | null
          created_at?: string
          department_id?: string
          id?: string
          is_done_state?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_columns_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      builder_test_runs: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          mock_payload: Json
          result: Json | null
          status: string
          target_ref: string
          target_type: string
          validation_passed: boolean | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          mock_payload?: Json
          result?: Json | null
          status: string
          target_ref: string
          target_type: string
          validation_passed?: boolean | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          mock_payload?: Json
          result?: Json | null
          status?: string
          target_ref?: string
          target_type?: string
          validation_passed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "builder_test_runs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      changelog: {
        Row: {
          category: string | null
          created_at: string
          created_by: string
          description: string
          id: string
          published_at: string | null
          published_by: string | null
          related_feedback: string[] | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by: string
          description: string
          id?: string
          published_at?: string | null
          published_by?: string | null
          related_feedback?: string[] | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          published_at?: string | null
          published_by?: string | null
          related_feedback?: string[] | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "changelog_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "changelog_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      context_packets: {
        Row: {
          agent_id: string | null
          created_at: string
          id: string
          packet_type: string
          prompt_text: string
          retrieval_doc_ids: string[] | null
          state_json: Json
          task_id: string | null
          workflow_run_id: string | null
          workflow_run_step_id: string | null
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          id?: string
          packet_type: string
          prompt_text: string
          retrieval_doc_ids?: string[] | null
          state_json: Json
          task_id?: string | null
          workflow_run_id?: string | null
          workflow_run_step_id?: string | null
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          id?: string
          packet_type?: string
          prompt_text?: string
          retrieval_doc_ids?: string[] | null
          state_json?: Json
          task_id?: string | null
          workflow_run_id?: string | null
          workflow_run_step_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "context_packets_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "context_packets_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "context_packets_workflow_run_id_fkey"
            columns: ["workflow_run_id"]
            isOneToOne: false
            referencedRelation: "workflow_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "context_packets_workflow_run_step_id_fkey"
            columns: ["workflow_run_step_id"]
            isOneToOne: false
            referencedRelation: "workflow_run_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_entries: {
        Row: {
          archived_at: string | null
          content: Json
          created_at: string
          date: string
          department_id: string | null
          id: string
          is_public: boolean
          team_id: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          content: Json
          created_at?: string
          date: string
          department_id?: string | null
          id?: string
          is_public?: boolean
          team_id?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          content?: Json
          created_at?: string
          date?: string
          department_id?: string | null
          id?: string
          is_public?: boolean
          team_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_entries_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_entries_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_entry_task_links: {
        Row: {
          comment: string | null
          daily_entry_id: string
          id: string
          signal: string | null
          task_id: string
        }
        Insert: {
          comment?: string | null
          daily_entry_id: string
          id?: string
          signal?: string | null
          task_id: string
        }
        Update: {
          comment?: string | null
          daily_entry_id?: string
          id?: string
          signal?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_entry_task_links_daily_entry_id_fkey"
            columns: ["daily_entry_id"]
            isOneToOne: false
            referencedRelation: "daily_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_entry_task_links_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_routines_config: {
        Row: {
          check_in_end_hour: number
          check_in_start_hour: number
          created_at: string
          digest_channel_discord: string | null
          digest_channel_teams: string | null
          digest_enabled: boolean
          digest_time_hour: number
          digest_time_minute: number
          id: string
          reminder_time_hour: number | null
          reminder_time_minute: number | null
          reminders_enabled: boolean
          standup_end_hour: number
          standup_start_hour: number
          team_id: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          check_in_end_hour?: number
          check_in_start_hour?: number
          created_at?: string
          digest_channel_discord?: string | null
          digest_channel_teams?: string | null
          digest_enabled?: boolean
          digest_time_hour?: number
          digest_time_minute?: number
          id?: string
          reminder_time_hour?: number | null
          reminder_time_minute?: number | null
          reminders_enabled?: boolean
          standup_end_hour?: number
          standup_start_hour?: number
          team_id?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          check_in_end_hour?: number
          check_in_start_hour?: number
          created_at?: string
          digest_channel_discord?: string | null
          digest_channel_teams?: string | null
          digest_enabled?: boolean
          digest_time_hour?: number
          digest_time_minute?: number
          id?: string
          reminder_time_hour?: number | null
          reminder_time_minute?: number | null
          reminders_enabled?: boolean
          standup_end_hour?: number
          standup_start_hour?: number
          team_id?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_routines_config_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_routines_exclusions: {
        Row: {
          check_in_disabled: boolean
          created_at: string
          gratitude_disabled: boolean
          id: string
          quiet_period_end: string | null
          quiet_period_start: string | null
          reason: string | null
          standup_disabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          check_in_disabled?: boolean
          created_at?: string
          gratitude_disabled?: boolean
          id?: string
          quiet_period_end?: string | null
          quiet_period_start?: string | null
          reason?: string | null
          standup_disabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          check_in_disabled?: boolean
          created_at?: string
          gratitude_disabled?: boolean
          id?: string
          quiet_period_end?: string | null
          quiet_period_start?: string | null
          reason?: string | null
          standup_disabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_routines_exclusions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      department_members: {
        Row: {
          created_at: string
          department_id: string
          department_role: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department_id: string
          department_role?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department_id?: string
          department_role?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_members_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          parent_department_id: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_department_id?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_department_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_parent_department_id_fkey"
            columns: ["parent_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_runs: {
        Row: {
          command_label: string | null
          completed_at: string | null
          created_at: string
          diagnostic_type: string
          gateway_name: string
          id: string
          output: string | null
          started_at: string | null
          status: string
          triggered_by: string | null
        }
        Insert: {
          command_label?: string | null
          completed_at?: string | null
          created_at?: string
          diagnostic_type: string
          gateway_name: string
          id?: string
          output?: string | null
          started_at?: string | null
          status?: string
          triggered_by?: string | null
        }
        Update: {
          command_label?: string | null
          completed_at?: string | null
          created_at?: string
          diagnostic_type?: string
          gateway_name?: string
          id?: string
          output?: string | null
          started_at?: string | null
          status?: string
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_runs_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          category: string
          closed_at: string | null
          closed_reason: string | null
          content: string
          created_at: string
          id: string
          related_changelog: string[] | null
          response: string | null
          response_at: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category: string
          closed_at?: string | null
          closed_reason?: string | null
          content: string
          created_at?: string
          id?: string
          related_changelog?: string[] | null
          response?: string | null
          response_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string
          closed_at?: string | null
          closed_reason?: string | null
          content?: string
          created_at?: string
          id?: string
          related_changelog?: string[] | null
          response?: string | null
          response_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gateway_health_checks: {
        Row: {
          checked_at: string
          gateway_name: string
          heartbeat_source_id: string | null
          id: string
          latency_ms: number | null
          payload: Json | null
          status: string
        }
        Insert: {
          checked_at?: string
          gateway_name: string
          heartbeat_source_id?: string | null
          id?: string
          latency_ms?: number | null
          payload?: Json | null
          status: string
        }
        Update: {
          checked_at?: string
          gateway_name?: string
          heartbeat_source_id?: string | null
          id?: string
          latency_ms?: number | null
          payload?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "gateway_health_checks_heartbeat_source_id_fkey"
            columns: ["heartbeat_source_id"]
            isOneToOne: false
            referencedRelation: "heartbeat_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      heartbeat_events: {
        Row: {
          created_at: string
          heartbeat_source_id: string
          id: string
          payload: Json | null
          status: string
        }
        Insert: {
          created_at?: string
          heartbeat_source_id: string
          id?: string
          payload?: Json | null
          status: string
        }
        Update: {
          created_at?: string
          heartbeat_source_id?: string
          id?: string
          payload?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "heartbeat_events_heartbeat_source_id_fkey"
            columns: ["heartbeat_source_id"]
            isOneToOne: false
            referencedRelation: "heartbeat_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      heartbeat_sources: {
        Row: {
          agent_id: string | null
          created_at: string
          expected_interval_seconds: number
          id: string
          last_seen_at: string | null
          source_key: string
          source_type: string
          status: string
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          expected_interval_seconds: number
          id?: string
          last_seen_at?: string | null
          source_key: string
          source_type: string
          status: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          expected_interval_seconds?: number
          id?: string
          last_seen_at?: string | null
          source_key?: string
          source_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "heartbeat_sources_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      human_ownership_links: {
        Row: {
          created_at: string
          id: string
          ownership_type: string
          target_ref: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ownership_type: string
          target_ref: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ownership_type?: string
          target_ref?: string
          target_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "human_ownership_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          agent_id: string | null
          created_at: string
          id: string
          incident_type: string
          opened_at: string
          resolved_at: string | null
          severity: string
          source_ref: string
          status: string
          summary: string | null
          task_id: string | null
          title: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          id?: string
          incident_type: string
          opened_at?: string
          resolved_at?: string | null
          severity: string
          source_ref: string
          status?: string
          summary?: string | null
          task_id?: string | null
          title: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          id?: string
          incident_type?: string
          opened_at?: string
          resolved_at?: string | null
          severity?: string
          source_ref?: string
          status?: string
          summary?: string | null
          task_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_documents: {
        Row: {
          created_at: string
          doc_type: string
          id: string
          is_active: boolean
          markdown_content: string
          scope: string
          scope_ref: string
          source_kind: string
          source_ref: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          doc_type: string
          id?: string
          is_active?: boolean
          markdown_content: string
          scope: string
          scope_ref: string
          source_kind: string
          source_ref?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          id?: string
          is_active?: boolean
          markdown_content?: string
          scope?: string
          scope_ref?: string
          source_kind?: string
          source_ref?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      memory_facts: {
        Row: {
          approved: boolean
          created_at: string
          fact_key: string
          fact_type: string
          fact_value: Json
          id: string
          scope: string
          scope_ref: string
          source_kind: string
          source_ref: string | null
          updated_at: string
        }
        Insert: {
          approved?: boolean
          created_at?: string
          fact_key: string
          fact_type: string
          fact_value: Json
          id?: string
          scope: string
          scope_ref: string
          source_kind: string
          source_ref?: string | null
          updated_at?: string
        }
        Update: {
          approved?: boolean
          created_at?: string
          fact_key?: string
          fact_type?: string
          fact_value?: Json
          id?: string
          scope?: string
          scope_ref?: string
          source_kind?: string
          source_ref?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      memory_vectors: {
        Row: {
          agent_id: string | null
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          project_id: string | null
          scope: string
          scope_ref: string | null
          token_count: number | null
          workflow_id: string | null
        }
        Insert: {
          agent_id?: string | null
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string | null
          scope: string
          scope_ref?: string | null
          token_count?: number | null
          workflow_id?: string | null
        }
        Update: {
          agent_id?: string | null
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string | null
          scope?: string
          scope_ref?: string | null
          token_count?: number | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memory_vectors_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_control_views: {
        Row: {
          config: Json
          created_at: string
          created_by: string | null
          id: string
          name: string
          scope_ref: string | null
          scope_type: string
          view_key: string
        }
        Insert: {
          config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          scope_ref?: string | null
          scope_type: string
          view_key: string
        }
        Update: {
          config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          scope_ref?: string | null
          scope_type?: string
          view_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_control_views_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_snapshots: {
        Row: {
          created_at: string
          id: string
          snapshot_date: string
          summary: Json
        }
        Insert: {
          created_at?: string
          id?: string
          snapshot_date: string
          summary: Json
        }
        Update: {
          created_at?: string
          id?: string
          snapshot_date?: string
          summary?: Json
        }
        Relationships: []
      }
      points_log: {
        Row: {
          action_type: string
          created_at: string
          created_by: string
          id: string
          metadata: Json | null
          points: number
          ref_id: string | null
          ref_type: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          created_by?: string
          id?: string
          metadata?: Json | null
          points: number
          ref_id?: string | null
          ref_type?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          created_by?: string
          id?: string
          metadata?: Json | null
          points?: number
          ref_id?: string | null
          ref_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      priority_rules: {
        Row: {
          config: Json
          created_at: string
          id: string
          name: string
          rule_key: string
          status: string
          updated_at: string
          weight: number
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          name: string
          rule_key: string
          status?: string
          updated_at?: string
          weight?: number
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          name?: string
          rule_key?: string
          status?: string
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      profile_reporting_lines: {
        Row: {
          created_at: string
          id: string
          manager_user_id: string
          report_user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          manager_user_id: string
          report_user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          manager_user_id?: string
          report_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_reporting_lines_manager_user_id_fkey"
            columns: ["manager_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_reporting_lines_report_user_id_fkey"
            columns: ["report_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          disabled_at: string | null
          email: string
          full_name: string | null
          gamification_enabled: boolean
          id: string
          role: string
          status: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          disabled_at?: string | null
          email: string
          full_name?: string | null
          gamification_enabled?: boolean
          id: string
          role?: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          disabled_at?: string | null
          email?: string
          full_name?: string | null
          gamification_enabled?: boolean
          id?: string
          role?: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          archived_at: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          department_id: string
          description: string | null
          id: string
          name: string
          owner_id: string | null
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          department_id: string
          description?: string | null
          id?: string
          name: string
          owner_id?: string | null
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pulse_survey_summaries: {
        Row: {
          approved_by: string | null
          artifact_id: string | null
          created_at: string
          created_by: string | null
          id: string
          published_at: string | null
          status: string
          summary_markdown: string
          survey_id: string
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          artifact_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          published_at?: string | null
          status?: string
          summary_markdown: string
          survey_id: string
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          artifact_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          published_at?: string | null
          status?: string
          summary_markdown?: string
          survey_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pulse_survey_summaries_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pulse_survey_summaries_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pulse_survey_summaries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pulse_survey_summaries_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "pulse_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      pulse_surveys: {
        Row: {
          closes_at: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          questions: Json
          sent_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          closes_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          questions: Json
          sent_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          closes_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          questions?: Json
          sent_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pulse_surveys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sandbox_artifacts: {
        Row: {
          artifact_type: string
          content: Json | null
          created_at: string
          file_path: string | null
          id: string
          sandbox_run_id: string
          storage_key: string | null
        }
        Insert: {
          artifact_type: string
          content?: Json | null
          created_at?: string
          file_path?: string | null
          id?: string
          sandbox_run_id: string
          storage_key?: string | null
        }
        Update: {
          artifact_type?: string
          content?: Json | null
          created_at?: string
          file_path?: string | null
          id?: string
          sandbox_run_id?: string
          storage_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sandbox_artifacts_sandbox_run_id_fkey"
            columns: ["sandbox_run_id"]
            isOneToOne: false
            referencedRelation: "sandbox_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      sandbox_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          error: string | null
          execution_time_ms: number | null
          expires_at: string
          id: string
          mock_payload: Json
          predicted_progression: Json | null
          result: Json | null
          status: string
          updated_at: string
          user_id: string
          workflow_id: string
          workflow_version_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error?: string | null
          execution_time_ms?: number | null
          expires_at?: string
          id?: string
          mock_payload: Json
          predicted_progression?: Json | null
          result?: Json | null
          status?: string
          updated_at?: string
          user_id: string
          workflow_id: string
          workflow_version_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error?: string | null
          execution_time_ms?: number | null
          expires_at?: string
          id?: string
          mock_payload?: Json
          predicted_progression?: Json | null
          result?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
          workflow_id?: string
          workflow_version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sandbox_runs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sandbox_runs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sandbox_runs_workflow_version_id_fkey"
            columns: ["workflow_version_id"]
            isOneToOne: false
            referencedRelation: "workflow_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_definition_versions: {
        Row: {
          change_summary: string | null
          created_at: string
          id: string
          saved_by: string | null
          skill_definition_id: string
          snapshot: Json
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          created_at?: string
          id?: string
          saved_by?: string | null
          skill_definition_id: string
          snapshot: Json
          version_number: number
        }
        Update: {
          change_summary?: string | null
          created_at?: string
          id?: string
          saved_by?: string | null
          skill_definition_id?: string
          snapshot?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "skill_definition_versions_saved_by_fkey"
            columns: ["saved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_definition_versions_skill_definition_id_fkey"
            columns: ["skill_definition_id"]
            isOneToOne: false
            referencedRelation: "skill_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_definitions: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          dispatch_mode: string
          human_review_required: boolean
          id: string
          input_schema: Json
          instruction_markdown: string
          name: string
          output_schema: Json
          published_at: string | null
          skill_key: string
          status: string
          updated_at: string
          updated_by: string | null
          validation_rules: Json
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          dispatch_mode: string
          human_review_required?: boolean
          id?: string
          input_schema?: Json
          instruction_markdown: string
          name: string
          output_schema?: Json
          published_at?: string | null
          skill_key: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          validation_rules?: Json
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          dispatch_mode?: string
          human_review_required?: boolean
          id?: string
          input_schema?: Json
          instruction_markdown?: string
          name?: string
          output_schema?: Json
          published_at?: string | null
          skill_key?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          validation_rules?: Json
        }
        Relationships: [
          {
            foreignKeyName: "skill_definitions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_definitions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          answers: Json
          created_at: string
          id: string
          survey_id: string
        }
        Insert: {
          answers: Json
          created_at?: string
          id?: string
          survey_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          id?: string
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "pulse_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      system_state: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "system_state_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_item_files: {
        Row: {
          artifact_id: string | null
          created_at: string
          file_kind: string
          file_name: string | null
          file_path: string | null
          id: string
          is_primary: boolean
          mime_type: string | null
          review_status: string
          storage_key: string | null
          storage_kind: string
          task_item_id: string
          version_number: number
        }
        Insert: {
          artifact_id?: string | null
          created_at?: string
          file_kind: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          is_primary?: boolean
          mime_type?: string | null
          review_status?: string
          storage_key?: string | null
          storage_kind: string
          task_item_id: string
          version_number?: number
        }
        Update: {
          artifact_id?: string | null
          created_at?: string
          file_kind?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          is_primary?: boolean
          mime_type?: string | null
          review_status?: string
          storage_key?: string | null
          storage_kind?: string
          task_item_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "task_item_files_artifact_fk"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_item_files_task_item_id_fkey"
            columns: ["task_item_id"]
            isOneToOne: false
            referencedRelation: "task_items"
            referencedColumns: ["id"]
          },
        ]
      }
      task_items: {
        Row: {
          assigned_to: string | null
          board_column_id: string | null
          completed_at: string | null
          correlation_id: string | null
          created_at: string
          created_by_ref: string | null
          created_by_type: string
          department_id: string | null
          description: string | null
          id: string
          item_type: string
          parent_task_item_id: string | null
          priority: number
          project_id: string | null
          status: string
          task_id: string | null
          title: string
          updated_at: string
          workflow_run_id: string | null
          workflow_run_step_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          board_column_id?: string | null
          completed_at?: string | null
          correlation_id?: string | null
          created_at?: string
          created_by_ref?: string | null
          created_by_type: string
          department_id?: string | null
          description?: string | null
          id?: string
          item_type: string
          parent_task_item_id?: string | null
          priority?: number
          project_id?: string | null
          status?: string
          task_id?: string | null
          title: string
          updated_at?: string
          workflow_run_id?: string | null
          workflow_run_step_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          board_column_id?: string | null
          completed_at?: string | null
          correlation_id?: string | null
          created_at?: string
          created_by_ref?: string | null
          created_by_type?: string
          department_id?: string | null
          description?: string | null
          id?: string
          item_type?: string
          parent_task_item_id?: string | null
          priority?: number
          project_id?: string | null
          status?: string
          task_id?: string | null
          title?: string
          updated_at?: string
          workflow_run_id?: string | null
          workflow_run_step_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_items_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_items_board_column_id_fkey"
            columns: ["board_column_id"]
            isOneToOne: false
            referencedRelation: "board_columns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_items_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_items_parent_task_item_id_fkey"
            columns: ["parent_task_item_id"]
            isOneToOne: false
            referencedRelation: "task_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_items_workflow_run_id_fkey"
            columns: ["workflow_run_id"]
            isOneToOne: false
            referencedRelation: "workflow_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_items_workflow_run_step_id_fkey"
            columns: ["workflow_run_step_id"]
            isOneToOne: false
            referencedRelation: "workflow_run_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      task_queue: {
        Row: {
          claimed_by: string | null
          id: string
          locked_until: string | null
          priority: number
          queued_at: string
          release_reason: string | null
          released_at: string | null
          task_id: string
        }
        Insert: {
          claimed_by?: string | null
          id?: string
          locked_until?: string | null
          priority?: number
          queued_at?: string
          release_reason?: string | null
          released_at?: string | null
          task_id: string
        }
        Update: {
          claimed_by?: string | null
          id?: string
          locked_until?: string | null
          priority?: number
          queued_at?: string
          release_reason?: string | null
          released_at?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_queue_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: true
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          agent_id: string | null
          approved_by: string | null
          assigned_to: string | null
          attempt_count: number
          completed_at: string | null
          context: Json
          correlation_id: string | null
          created_at: string
          department_id: string | null
          error: string | null
          id: string
          parent_task_id: string | null
          payload: Json
          project_id: string | null
          result: Json | null
          source: string | null
          source_ref: string | null
          status: string
          type: string
          updated_at: string
          workflow_id: string | null
          workflow_run_id: string | null
          workflow_run_step_id: string | null
          workflow_version_id: string | null
        }
        Insert: {
          agent_id?: string | null
          approved_by?: string | null
          assigned_to?: string | null
          attempt_count?: number
          completed_at?: string | null
          context?: Json
          correlation_id?: string | null
          created_at?: string
          department_id?: string | null
          error?: string | null
          id?: string
          parent_task_id?: string | null
          payload?: Json
          project_id?: string | null
          result?: Json | null
          source?: string | null
          source_ref?: string | null
          status?: string
          type: string
          updated_at?: string
          workflow_id?: string | null
          workflow_run_id?: string | null
          workflow_run_step_id?: string | null
          workflow_version_id?: string | null
        }
        Update: {
          agent_id?: string | null
          approved_by?: string | null
          assigned_to?: string | null
          attempt_count?: number
          completed_at?: string | null
          context?: Json
          correlation_id?: string | null
          created_at?: string
          department_id?: string | null
          error?: string | null
          id?: string
          parent_task_id?: string | null
          payload?: Json
          project_id?: string | null
          result?: Json | null
          source?: string | null
          source_ref?: string | null
          status?: string
          type?: string
          updated_at?: string
          workflow_id?: string | null
          workflow_run_id?: string | null
          workflow_run_step_id?: string | null
          workflow_version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_workflow_run_id_fkey"
            columns: ["workflow_run_id"]
            isOneToOne: false
            referencedRelation: "workflow_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_workflow_run_step_id_fkey"
            columns: ["workflow_run_step_id"]
            isOneToOne: false
            referencedRelation: "workflow_run_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_workflow_version_id_fkey"
            columns: ["workflow_version_id"]
            isOneToOne: false
            referencedRelation: "workflow_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      team_activity: {
        Row: {
          author_id: string
          content: Json
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          id: string
          reaction_count: Json
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: Json
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          reaction_count?: Json
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: Json
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          reaction_count?: Json
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_activity_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_activity_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_activity_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          team_activity_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          team_activity_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          team_activity_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_activity_reactions_team_activity_id_fkey"
            columns: ["team_activity_id"]
            isOneToOne: false
            referencedRelation: "team_activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_activity_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_activity_responses: {
        Row: {
          created_at: string
          id: string
          response: Json | null
          team_activity_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          response?: Json | null
          team_activity_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          response?: Json | null
          team_activity_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_activity_responses_team_activity_id_fkey"
            columns: ["team_activity_id"]
            isOneToOne: false
            referencedRelation: "team_activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_activity_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          membership_role: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          membership_role?: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          membership_role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      wiki_articles: {
        Row: {
          archived_at: string | null
          author_id: string | null
          category: string
          content: string
          created_at: string
          deleted_at: string | null
          editor_id: string | null
          id: string
          published_at: string | null
          slug: string
          status: string
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          archived_at?: string | null
          author_id?: string | null
          category: string
          content: string
          created_at?: string
          deleted_at?: string | null
          editor_id?: string | null
          id?: string
          published_at?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          archived_at?: string | null
          author_id?: string | null
          category?: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          editor_id?: string | null
          id?: string
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "wiki_articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_articles_editor_id_fkey"
            columns: ["editor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wiki_versions: {
        Row: {
          article_id: string
          change_summary: string | null
          content: string
          created_at: string
          edited_by: string | null
          id: string
          version_number: number
        }
        Insert: {
          article_id: string
          change_summary?: string | null
          content: string
          created_at?: string
          edited_by?: string | null
          id?: string
          version_number: number
        }
        Update: {
          article_id?: string
          change_summary?: string | null
          content?: string
          created_at?: string
          edited_by?: string | null
          id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "wiki_versions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "wiki_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_versions_edited_by_fkey"
            columns: ["edited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_edges: {
        Row: {
          condition_type: string
          config: Json
          created_at: string
          edge_key: string
          id: string
          source_node_key: string
          target_node_key: string
          workflow_version_id: string
        }
        Insert: {
          condition_type?: string
          config?: Json
          created_at?: string
          edge_key: string
          id?: string
          source_node_key: string
          target_node_key: string
          workflow_version_id: string
        }
        Update: {
          condition_type?: string
          config?: Json
          created_at?: string
          edge_key?: string
          id?: string
          source_node_key?: string
          target_node_key?: string
          workflow_version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_edges_source_fk"
            columns: ["workflow_version_id", "source_node_key"]
            isOneToOne: false
            referencedRelation: "workflow_nodes"
            referencedColumns: ["workflow_version_id", "node_key"]
          },
          {
            foreignKeyName: "workflow_edges_target_fk"
            columns: ["workflow_version_id", "target_node_key"]
            isOneToOne: false
            referencedRelation: "workflow_nodes"
            referencedColumns: ["workflow_version_id", "node_key"]
          },
          {
            foreignKeyName: "workflow_edges_workflow_version_id_fkey"
            columns: ["workflow_version_id"]
            isOneToOne: false
            referencedRelation: "workflow_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_nodes: {
        Row: {
          config: Json
          created_at: string
          id: string
          label: string
          node_key: string
          node_type: string
          position_x: number | null
          position_y: number | null
          workflow_version_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          label: string
          node_key: string
          node_type: string
          position_x?: number | null
          position_y?: number | null
          workflow_version_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          label?: string
          node_key?: string
          node_type?: string
          position_x?: number | null
          position_y?: number | null
          workflow_version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_nodes_workflow_version_id_fkey"
            columns: ["workflow_version_id"]
            isOneToOne: false
            referencedRelation: "workflow_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_run_steps: {
        Row: {
          completed_at: string | null
          correlation_id: string | null
          created_at: string
          error: string | null
          executor_ref: string | null
          executor_type: string
          group_key: string | null
          id: string
          input_payload: Json
          output_payload: Json | null
          parent_step_run_id: string | null
          started_at: string | null
          status: string
          updated_at: string
          workflow_node_id: string
          workflow_run_id: string
        }
        Insert: {
          completed_at?: string | null
          correlation_id?: string | null
          created_at?: string
          error?: string | null
          executor_ref?: string | null
          executor_type: string
          group_key?: string | null
          id?: string
          input_payload?: Json
          output_payload?: Json | null
          parent_step_run_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          workflow_node_id: string
          workflow_run_id: string
        }
        Update: {
          completed_at?: string | null
          correlation_id?: string | null
          created_at?: string
          error?: string | null
          executor_ref?: string | null
          executor_type?: string
          group_key?: string | null
          id?: string
          input_payload?: Json
          output_payload?: Json | null
          parent_step_run_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          workflow_node_id?: string
          workflow_run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_run_steps_parent_step_run_id_fkey"
            columns: ["parent_step_run_id"]
            isOneToOne: false
            referencedRelation: "workflow_run_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_run_steps_workflow_node_id_fkey"
            columns: ["workflow_node_id"]
            isOneToOne: false
            referencedRelation: "workflow_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_run_steps_workflow_run_id_fkey"
            columns: ["workflow_run_id"]
            isOneToOne: false
            referencedRelation: "workflow_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_runs: {
        Row: {
          completed_at: string | null
          context_packet_id: string | null
          correlation_id: string | null
          created_at: string
          current_step_run_id: string | null
          department_id: string
          id: string
          initiated_by: string | null
          input_payload: Json
          project_id: string | null
          started_at: string | null
          status: string
          trigger_ref: string | null
          trigger_type: string
          updated_at: string
          workflow_id: string
          workflow_version_id: string
        }
        Insert: {
          completed_at?: string | null
          context_packet_id?: string | null
          correlation_id?: string | null
          created_at?: string
          current_step_run_id?: string | null
          department_id: string
          id?: string
          initiated_by?: string | null
          input_payload?: Json
          project_id?: string | null
          started_at?: string | null
          status?: string
          trigger_ref?: string | null
          trigger_type: string
          updated_at?: string
          workflow_id: string
          workflow_version_id: string
        }
        Update: {
          completed_at?: string | null
          context_packet_id?: string | null
          correlation_id?: string | null
          created_at?: string
          current_step_run_id?: string | null
          department_id?: string
          id?: string
          initiated_by?: string | null
          input_payload?: Json
          project_id?: string | null
          started_at?: string | null
          status?: string
          trigger_ref?: string | null
          trigger_type?: string
          updated_at?: string
          workflow_id?: string
          workflow_version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_runs_context_packet_fk"
            columns: ["context_packet_id"]
            isOneToOne: false
            referencedRelation: "context_packets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_runs_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_runs_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_runs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_runs_workflow_version_id_fkey"
            columns: ["workflow_version_id"]
            isOneToOne: false
            referencedRelation: "workflow_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_step_dependencies: {
        Row: {
          dependency_type: string
          depends_on_step_run_id: string
          id: string
          step_run_id: string
          workflow_run_id: string
        }
        Insert: {
          dependency_type?: string
          depends_on_step_run_id: string
          id?: string
          step_run_id: string
          workflow_run_id: string
        }
        Update: {
          dependency_type?: string
          depends_on_step_run_id?: string
          id?: string
          step_run_id?: string
          workflow_run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_step_dependencies_depends_on_step_run_id_fkey"
            columns: ["depends_on_step_run_id"]
            isOneToOne: false
            referencedRelation: "workflow_run_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_step_dependencies_step_run_id_fkey"
            columns: ["step_run_id"]
            isOneToOne: false
            referencedRelation: "workflow_run_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_step_dependencies_workflow_run_id_fkey"
            columns: ["workflow_run_id"]
            isOneToOne: false
            referencedRelation: "workflow_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_triggers: {
        Row: {
          active: boolean
          config: Json
          created_at: string
          id: string
          trigger_key: string
          trigger_type: string
          workflow_version_id: string
        }
        Insert: {
          active?: boolean
          config: Json
          created_at?: string
          id?: string
          trigger_key: string
          trigger_type: string
          workflow_version_id: string
        }
        Update: {
          active?: boolean
          config?: Json
          created_at?: string
          id?: string
          trigger_key?: string
          trigger_type?: string
          workflow_version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_triggers_workflow_version_id_fkey"
            columns: ["workflow_version_id"]
            isOneToOne: false
            referencedRelation: "workflow_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_versions: {
        Row: {
          change_summary: string | null
          created_at: string
          description_snapshot: string | null
          id: string
          name_snapshot: string
          primary_agent_id: string | null
          requires_approval: boolean
          requires_approval_reason: string | null
          saved_by: string | null
          status_snapshot: string
          version_number: number
          workflow_id: string
        }
        Insert: {
          change_summary?: string | null
          created_at?: string
          description_snapshot?: string | null
          id?: string
          name_snapshot: string
          primary_agent_id?: string | null
          requires_approval: boolean
          requires_approval_reason?: string | null
          saved_by?: string | null
          status_snapshot: string
          version_number: number
          workflow_id: string
        }
        Update: {
          change_summary?: string | null
          created_at?: string
          description_snapshot?: string | null
          id?: string
          name_snapshot?: string
          primary_agent_id?: string | null
          requires_approval?: boolean
          requires_approval_reason?: string | null
          saved_by?: string | null
          status_snapshot?: string
          version_number?: number
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_versions_primary_agent_id_fkey"
            columns: ["primary_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_versions_saved_by_fkey"
            columns: ["saved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_versions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          active_version_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          department_id: string
          description: string | null
          id: string
          key: string
          name: string
          primary_agent_id: string | null
          requires_approval: boolean
          requires_approval_reason: string | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active_version_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          department_id: string
          description?: string | null
          id?: string
          key: string
          name: string
          primary_agent_id?: string | null
          requires_approval?: boolean
          requires_approval_reason?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active_version_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          department_id?: string
          description?: string | null
          id?: string
          key?: string
          name?: string
          primary_agent_id?: string | null
          requires_approval?: boolean
          requires_approval_reason?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflows_active_version_fk"
            columns: ["active_version_id"]
            isOneToOne: false
            referencedRelation: "workflow_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflows_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflows_primary_agent_id_fkey"
            columns: ["primary_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflows_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
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
      check_gateway_health: { Args: never; Returns: undefined }
      check_sla_violations: { Args: never; Returns: undefined }
      cleanup_stale_workflow_runs: { Args: never; Returns: undefined }
      generate_agent_daily_summaries: { Args: never; Returns: undefined }
      match_memory_vectors: {
        Args: {
          filter_project_id?: string
          filter_scope?: string
          filter_scope_ref?: string
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          scope: string
          similarity: number
        }[]
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

